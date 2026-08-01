import * as React from 'react';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat';
import { ResourceLink, Timestamp } from '@console/dynamic-plugin-sdk/src/lib-core';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { openRollbackModal, openUninstallModal } from './helm-actions';
import { getHelmRelease, getHelmReleaseHistory } from './helm-api';
import { HelmRelease } from './helm-types';
import { HelmReleaseStatus } from './HelmReleaseStatus';
import { parseHelmManifest } from './parseHelmManifest';

const Tab: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <li
    className={`co-m-horizontal-nav__menu-item${active ? ' co-m-horizontal-nav-item--active' : ''}`}
  >
    {children}
  </li>
);

const ActionsDropdown: React.FC<{ release: HelmRelease; onUninstalled: () => void }> = ({
  release,
  onUninstalled,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => setOpen(false)}
      toggle={
        <DropdownToggle onToggle={(_event, next) => setOpen(next)}>
          {t('public~Actions')}
        </DropdownToggle>
      }
      isPlain
      position="right"
      dropdownItems={[
        <DropdownItem
          key="rollback"
          onClick={() => openRollbackModal(release.namespace, release.name, release.version - 1, t)}
          isDisabled={release.version <= 1}
        >
          {t('public~Rollback')}
        </DropdownItem>,
        <DropdownItem
          key="uninstall"
          onClick={() => openUninstallModal(release.namespace, release.name, t).then(onUninstalled)}
        >
          {t('public~Uninstall')}
        </DropdownItem>,
      ]}
    />
  );
};

const DetailsTab: React.FC<{ release: HelmRelease }> = ({ release }) => (
  <div className="co-m-pane__body">
    <SectionHeading text="Release details" />
    <dl className="co-m-pane__details">
      <dt>Name</dt>
      <dd>{release.name}</dd>
      <dt>Namespace</dt>
      <dd>
        <ResourceLink kind="Namespace" name={release.namespace} />
      </dd>
      <dt>Status</dt>
      <dd>
        <HelmReleaseStatus status={release.info?.status} />
      </dd>
      <dt>Chart</dt>
      <dd>
        {release.chart?.metadata?.name} {release.chart?.metadata?.version}
      </dd>
      <dt>App version</dt>
      <dd>{release.chart?.metadata?.appVersion || '-'}</dd>
      <dt>Revision</dt>
      <dd>{release.version}</dd>
      <dt>Last deployed</dt>
      <dd>
        <Timestamp timestamp={release.info?.last_deployed} />
      </dd>
    </dl>
  </div>
);

const ResourcesTab: React.FC<{ release: HelmRelease }> = ({ release }) => {
  const { t } = useTranslation();
  const resources = React.useMemo(() => parseHelmManifest(release.manifest), [release.manifest]);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~Resources')} />
      {resources.length === 0 ? (
        <p className="text-muted">{t('public~No resources found in this release.')}</p>
      ) : (
        <ul className="list-group">
          {resources.map((resource) => (
            <li
              className="list-group-item"
              key={`${resource.kind}/${resource.namespace ?? ''}/${resource.name}`}
            >
              <ResourceLink
                kind={resource.kind}
                name={resource.name}
                namespace={resource.namespace ?? release.namespace}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const HistoryTab: React.FC<{ namespace: string; name: string; currentVersion: number }> = ({
  namespace,
  name,
  currentVersion,
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = React.useState<HelmRelease[]>();
  const [loadError, setLoadError] = React.useState<string>();

  React.useEffect(() => {
    getHelmReleaseHistory(namespace, name)
      .then(setHistory)
      .catch((err) => setLoadError(err?.message || String(err)));
  }, [namespace, name]);

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~Revision history')} />
      <StatusBox data={history} loaded={!!history || !!loadError} loadError={loadError}>
        <table className="pf-v5-c-table pf-m-compact pf-m-grid-md">
          <thead>
            <tr>
              <th>{t('public~Revision')}</th>
              <th>{t('public~Status')}</th>
              <th>{t('public~Chart version')}</th>
              <th>{t('public~App version')}</th>
              <th>{t('public~Updated')}</th>
              <th>{t('public~Description')}</th>
            </tr>
          </thead>
          <tbody>
            {(history ?? [])
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((rev) => (
                <tr key={rev.version}>
                  <td>
                    {rev.version}
                    {rev.version === currentVersion ? ` (${t('public~current')})` : ''}
                  </td>
                  <td>
                    <HelmReleaseStatus status={rev.info?.status} />
                  </td>
                  <td>{rev.chart?.metadata?.version}</td>
                  <td>{rev.chart?.metadata?.appVersion || '-'}</td>
                  <td>
                    <Timestamp timestamp={rev.info?.last_deployed} />
                  </td>
                  <td>{rev.info?.description}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </StatusBox>
    </div>
  );
};

export const HelmReleaseDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, name } = useParams<{ ns: string; name: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [release, setRelease] = React.useState<HelmRelease>();
  const [loadError, setLoadError] = React.useState<string>();

  const fetchRelease = React.useCallback(() => {
    getHelmRelease(namespace, name)
      .then((result) => {
        setRelease(result);
        setLoadError(undefined);
      })
      .catch((err) => setLoadError(err?.message || String(err)));
  }, [namespace, name]);

  React.useEffect(() => {
    fetchRelease();
  }, [fetchRelease]);

  const base = `/helm-releases/ns/${namespace}/${name}`;
  const detailsPath = base;
  const resourcesPath = `${base}/resources`;
  const historyPath = `${base}/history`;

  return (
    <>
      <Helmet>
        <title>{name}</title>
      </Helmet>
      <div className="pf-v5-c-page__main-breadcrumb">
        <Breadcrumb className="co-breadcrumb">
          <BreadcrumbItem>
            <Link className="pf-v5-c-breadcrumb__link" to="/helm-releases">
              {t('public~Helm releases')}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{name}</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name">{name}</span>
          </div>
          {release && (
            <div className="co-actions">
              <ActionsDropdown release={release} onUninstalled={() => navigate('/helm-releases')} />
            </div>
          )}
        </h1>
      </div>
      <ul className="co-m-horizontal-nav__menu">
        <Tab active={pathname === detailsPath}>
          <Link to={detailsPath}>{t('public~Details')}</Link>
        </Tab>
        <Tab active={pathname === resourcesPath}>
          <Link to={resourcesPath}>{t('public~Resources')}</Link>
        </Tab>
        <Tab active={pathname === historyPath}>
          <Link to={historyPath}>{t('public~Revision history')}</Link>
        </Tab>
      </ul>
      <StatusBox data={release} loaded={!!release || !!loadError} loadError={loadError}>
        {release && pathname === resourcesPath && <ResourcesTab release={release} />}
        {release && pathname === historyPath && (
          <HistoryTab namespace={namespace} name={name} currentVersion={release.version} />
        )}
        {release && pathname === detailsPath && <DetailsTab release={release} />}
      </StatusBox>
    </>
  );
};

export default HelmReleaseDetailsPage;

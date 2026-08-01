import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import { Alert } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { isEmpty } from 'lodash-es';

import { ListPageBody, RowFilter, RowProps, TableColumn } from '@console/dynamic-plugin-sdk';
import {
  ListPageFilter,
  ListPageHeader,
  ResourceLink,
  useListPageFilter,
  VirtualizedTable,
} from '@console/dynamic-plugin-sdk/src/lib-core';

import { listHelmReleases } from './helm-api';
import { HelmRelease } from './helm-types';
import { HelmReleaseStatus } from './HelmReleaseStatus';

const tableClasses = [
  '', // Name
  'pf-v5-u-w-16-on-md', // Namespace
  'pf-v5-u-w-16-on-md', // Status
  '', // Chart
  'pf-m-hidden pf-m-visible-on-md', // Chart version
  'pf-m-hidden pf-m-visible-on-md', // App version
];

const Row: React.FC<RowProps<HelmRelease>> = ({ obj }) => (
  <>
    <td className={tableClasses[0]}>
      <Link to={`/helm-releases/ns/${obj.namespace}/${obj.name}`}>{obj.name}</Link>
    </td>
    <td className={tableClasses[1]}>
      <ResourceLink kind="Namespace" name={obj.namespace} />
    </td>
    <td className={tableClasses[2]}>
      <HelmReleaseStatus status={obj.info?.status} />
    </td>
    <td className={tableClasses[3]}>{obj.chart?.metadata?.name}</td>
    <td className={tableClasses[4]}>{obj.chart?.metadata?.version}</td>
    <td className={tableClasses[5]}>{obj.chart?.metadata?.appVersion || '-'}</td>
  </>
);

export const HelmReleasesPage: React.FC = () => {
  const { t } = useTranslation();
  // Reachable at /helm-releases/ns/:ns and /helm-releases/all-namespaces (see
  // console-app/console-extensions.json); the latter has no :ns param.
  const { ns: namespace } = useParams<{ ns: string }>();
  const [releases, setReleases] = React.useState<HelmRelease[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string>();

  React.useEffect(() => {
    if (!namespace) {
      setReleases([]);
      setLoaded(true);
      setLoadError(undefined);
      return;
    }
    setLoaded(false);
    listHelmReleases(namespace)
      .then((result) => {
        setReleases(result || []);
        setLoaded(true);
        setLoadError(undefined);
      })
      .catch((err) => {
        setLoaded(true);
        setLoadError(err?.message || String(err));
      });
  }, [namespace]);

  const columns = React.useMemo<TableColumn<HelmRelease>[]>(
    () => [
      { id: 'name', title: t('public~Name'), sort: 'name', transforms: [sortable], props: { className: tableClasses[0] } },
      { id: 'namespace', title: t('public~Namespace'), sort: 'namespace', transforms: [sortable], props: { className: tableClasses[1] } },
      { id: 'status', title: t('public~Status'), sort: 'info.status', transforms: [sortable], props: { className: tableClasses[2] } },
      { id: 'chart', title: t('public~Chart'), sort: 'chart.metadata.name', transforms: [sortable], props: { className: tableClasses[3] } },
      { id: 'chartVersion', title: t('public~Chart version'), props: { className: tableClasses[4] } },
      { id: 'appVersion', title: t('public~App version'), props: { className: tableClasses[5] } },
    ],
    [t],
  );

  const nameFilter: RowFilter = {
    filter: (filter, release: HelmRelease) => !filter.selected?.[0] || release.name?.includes(filter.selected[0]),
    items: [],
    type: 'name',
  } as RowFilter;

  const [staticData, filteredData, onFilterChange] = useListPageFilter(releases, [nameFilter]);

  const title = t('public~Helm releases');

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <ListPageHeader title={title} />
      <ListPageBody>
        {!namespace ? (
          <Alert
            className="co-alert"
            isInline
            title={t('public~Select a project')}
            variant="info"
          >
            {t('public~Helm releases are listed one project at a time. Select a project to see its releases.')}
          </Alert>
        ) : (
          <>
            {loadError && (
              <Alert className="co-alert" isInline title={t('public~Error loading Helm releases')} variant="danger">
                {loadError}
              </Alert>
            )}
            <ListPageFilter
              data={staticData}
              loaded={loaded}
              onFilterChange={onFilterChange}
              nameFilterPlaceholder={t('public~Search by name...')}
              nameFilterTitle={t('public~Name')}
            />
            <VirtualizedTable<HelmRelease>
              aria-label={title}
              columns={columns}
              data={filteredData ?? []}
              loaded={loaded}
              loadError={loadError}
              Row={Row}
              unfilteredData={releases}
              NoDataEmptyMsg={() => (
                <div className="pf-v5-u-text-align-center">
                  {isEmpty(releases) && loaded
                    ? t('public~No Helm releases in this project')
                    : null}
                </div>
              )}
            />
          </>
        )}
      </ListPageBody>
    </>
  );
};

export default HelmReleasesPage;

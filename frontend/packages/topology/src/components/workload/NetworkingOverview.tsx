import * as React from 'react';
import { LongArrowAltRightIcon } from '@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useServicesWatcher } from '@console/shared';

const ServicePortList: React.FC<ServicePortListProps> = ({ service }) => {
  const ports = service.spec?.ports ?? [];
  const { t } = useTranslation();
  return (
    <ul className="port-list">
      {ports.map(({ name, port, protocol, targetPort }) => (
        <li key={name || `${protocol}/${port}`}>
          <span className="text-muted">{t('topology~Service port:')}</span>{' '}
          {name || `${protocol}/${port}`}
          &nbsp;
          <LongArrowAltRightIcon />
          &nbsp;
          <span className="text-muted">{t('topology~Pod port:')}</span> {targetPort}
        </li>
      ))}
    </ul>
  );
};

const ServicesOverviewListItem: React.FC<ServiceOverviewListItemProps> = ({ service }) => {
  const { name, namespace } = service.metadata;
  return (
    <li className="list-group-item">
      <ResourceLink kind="Service" name={name} namespace={namespace} />
      <ServicePortList service={service} />
    </li>
  );
};

const ServicesOverviewList: React.FC<ServiceOverviewListProps> = ({ services }) => (
  <ul className="list-group">
    {services?.map((service) => (
      <ServicesOverviewListItem key={service.metadata.uid} service={service} />
    ))}
  </ul>
);

// Upstream also lists Routes here. Routes are an OpenShift-only API with no vanilla-Kubernetes
// equivalent (Ingress isn't 1:1 with a workload the way a Route often is), so that section is
// dropped rather than always rendering empty.
export const NetworkingOverview: React.FC<NetworkingOverviewProps> = ({ obj }) => {
  const { t } = useTranslation();
  const serviceResources = useServicesWatcher(obj);
  const services =
    serviceResources.loaded && !serviceResources.loadError ? serviceResources.services : [];
  return (
    <>
      <SidebarSectionHeading text={t('topology~Services')} />
      {!(services?.length > 0) ? (
        <span className="text-muted">{t('topology~No Services found for this resource.')}</span>
      ) : (
        <ServicesOverviewList services={services} />
      )}
    </>
  );
};

type NetworkingOverviewProps = {
  obj: K8sResourceKind;
};

type ServicePortListProps = {
  service: K8sResourceKind;
};

type ServiceOverviewListProps = {
  services: K8sResourceKind[];
};

type ServiceOverviewListItemProps = {
  service: K8sResourceKind;
};

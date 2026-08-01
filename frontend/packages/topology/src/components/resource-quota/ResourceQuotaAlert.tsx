import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  useK8sWatchResources,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { ResourceQuotaModel } from '@console/internal/models';
import { ResourceQuotaKind } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { checkQuotaLimit } from '../utils/checkResourceQuota';

export interface ResourceQuotaAlertProps {
  namespace: string;
}

// Local stand-in for dev-console's ResourceQuotaAlert. Upstream also watches
// AppliedClusterResourceQuota, an OpenShift-only CRD that doesn't exist on vanilla Kubernetes --
// dropped, keeping the plain ResourceQuota warning.
export const ResourceQuotaAlert: React.FC<ResourceQuotaAlertProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [warningMessageFlag, setWarningMessageFlag] = React.useState<boolean>();
  const [resourceQuotaName, setResourceQuotaName] = React.useState(null);

  const watchedResources = React.useMemo(
    () => ({
      resourcequotas: {
        groupVersionKind: {
          kind: ResourceQuotaModel.kind,
          version: ResourceQuotaModel.apiVersion,
        },
        namespace,
        isList: true,
      },
    }),
    [namespace],
  );

  const { resourcequotas } = useK8sWatchResources<{
    resourcequotas: ResourceQuotaKind[];
  }>(watchedResources);

  const [totalResourcesAtQuota = [], quotaName] = React.useMemo(
    () =>
      resourcequotas.loaded && !resourcequotas.loadError
        ? checkQuotaLimit(resourcequotas.data)
        : [],
    [resourcequotas],
  );

  const filteredResourcesAtQuota = totalResourcesAtQuota.filter(
    (resourceAtQuota) => resourceAtQuota !== 0,
  );

  React.useEffect(() => {
    setResourceQuotaName(filteredResourcesAtQuota.length === 1 ? quotaName : null);
  }, [filteredResourcesAtQuota, quotaName]);

  React.useEffect(() => {
    setWarningMessageFlag(filteredResourcesAtQuota.length > 0);
  }, [filteredResourcesAtQuota]);

  const getRedirectLink = () => resourcePathFromModel(ResourceQuotaModel, resourceQuotaName, namespace);

  const onResourceQuotaLinkClick = () => {
    fireTelemetryEvent('Resource Quota Warning Label Clicked');
  };

  return (
    <>
      {warningMessageFlag && resourcequotas.loaded ? (
        <Label color="orange" icon={<YellowExclamationTriangleIcon />}>
          <Link
            to={getRedirectLink()}
            data-test="resource-quota-warning"
            onClick={onResourceQuotaLinkClick}
          >
            {t('devconsole~{{count}} resource reached quota', {
              count: filteredResourcesAtQuota.reduce((a, b) => a + b, 0),
            })}
          </Link>
        </Label>
      ) : null}
    </>
  );
};

export default ResourceQuotaAlert;

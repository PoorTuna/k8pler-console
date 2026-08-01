import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@patternfly/react-core';

// helm.sh/helm/v3/pkg/release.Status values, lowercased in the JSON the backend returns.
const STATUS_COLOR: { [status: string]: 'green' | 'red' | 'orange' | 'grey' } = {
  deployed: 'green',
  failed: 'red',
  'pending-install': 'orange',
  'pending-upgrade': 'orange',
  'pending-rollback': 'orange',
  uninstalling: 'orange',
  uninstalled: 'grey',
  superseded: 'grey',
  unknown: 'grey',
};

export const HelmReleaseStatus: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  if (!status) {
    return <>-</>;
  }
  return (
    <Label color={STATUS_COLOR[status] || 'grey'}>
      {t(`public~${status}`, { defaultValue: status })}
    </Label>
  );
};

export default HelmReleaseStatus;

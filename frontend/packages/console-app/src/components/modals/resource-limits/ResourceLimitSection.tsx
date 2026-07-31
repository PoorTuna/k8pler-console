import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import { ResourceLimitField } from '@console/shared';
import FormSection from './FormSection';

// Ported locally from the former @console/dev-console Import flow: generic
// CPU/memory request+limit fields, not OpenShift-specific.
export enum CPUUnits {
  m = 'millicores',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '' = 'cores',
}

export enum MemoryUnits {
  Mi = 'Mi',
  Gi = 'Gi',
}

export type ResourceLimitSectionProps = {
  hideTitle?: boolean;
};

const ResourceLimitSection: React.FC<ResourceLimitSectionProps> = ({ hideTitle }) => {
  const { t } = useTranslation();
  const {
    values: { container },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection
      title={!hideTitle && t('console-app~Resource limit')}
      subTitle={t(
        'console-app~Resource limits control how much CPU and memory a container will consume on a node.',
      )}
      fullWidth
    >
      {container && (
        <span>
          {t('console-app~Container')} &nbsp;
          <ResourceIcon kind={ContainerModel.kind} /> {container}
        </span>
      )}
      <div className="co-section-heading-tertiary">{t('console-app~CPU')}</div>
      <ResourceLimitField
        name="limits.cpu.request"
        label={t('console-app~Request')}
        unitName="limits.cpu.requestUnit"
        unitOptions={CPUUnits}
        helpText={t('console-app~The minimum amount of CPU the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label={t('console-app~Limit')}
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        helpText={t(
          'console-app~The maximum amount of CPU the Container is allowed to use when running.',
        )}
      />

      <div className="co-section-heading-tertiary">{t('console-app~Memory')}</div>
      <ResourceLimitField
        name="limits.memory.request"
        label={t('console-app~Request')}
        unitName="limits.memory.requestUnit"
        unitOptions={MemoryUnits}
        helpText={t('console-app~The minimum amount of Memory the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label={t('console-app~Limit')}
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        helpText={t(
          'console-app~The maximum amount of Memory the Container is allowed to use when running.',
        )}
      />
    </FormSection>
  );
};

export default ResourceLimitSection;

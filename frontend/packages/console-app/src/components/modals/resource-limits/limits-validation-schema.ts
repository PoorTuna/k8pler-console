import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { convertToBaseValue } from '@console/internal/components/utils';

// Ported locally from the former @console/dev-console Import flow's
// validation-schema.ts (limitsValidationSchema only) -- generic CPU/memory
// request+limit validation, not OpenShift-specific.
export const limitsValidationSchema = (t: TFunction) =>
  yup.object().shape({
    cpu: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, t('console-app~Request must be greater than or equal to 0.'))
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: t('console-app~CPU request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(t('console-app~Unit must be millicores or cores.')).ensure(),
      limitUnit: yup.string(t('console-app~Unit must be millicores or cores.')).ensure(),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, t('console-app~Limit must be greater than or equal to 0.'))
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${limit}${limitUnit}`) >=
                convertToBaseValue(`${request}${requestUnit}`)
              );
            }
            return true;
          },
          message: t('console-app~CPU limit must be greater than or equal to request.'),
        }),
    }),
    memory: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, t('console-app~Request must be greater than or equal to 0.'))
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: t('console-app~Memory request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(t('console-app~Unit must be Mi or Gi.')),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, t('console-app~Limit must be greater than or equal to 0.'))
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: t('console-app~Memory limit must be greater than or equal to request.'),
        }),
      limitUnit: yup.string(t('console-app~Unit must be Mi or Gi.')),
    }),
  });

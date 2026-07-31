import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

// Minimal shape of an OLM ClusterServiceVersion, kept local so this utility
// does not depend on OLM being installed/present in the console build.
export type ClusterServiceVersionKind = K8sResourceKind & {
  spec?: {
    customresourcedefinitions?: {
      owned?: { kind: string }[];
    };
  };
};

export type OperatorBackedServiceKindMap = {
  [name: string]: ClusterServiceVersionKind;
};

export const getOperatorBackedServiceKindMap = (
  installedOperators: ClusterServiceVersionKind[],
): OperatorBackedServiceKindMap =>
  installedOperators
    ? installedOperators.reduce((kindMap, csv) => {
        (csv?.spec?.customresourcedefinitions?.owned || []).forEach((crd) => {
          if (!(crd.kind in kindMap)) {
            kindMap[crd.kind] = csv;
          }
        });
        return kindMap;
      }, {})
    : {};

export const isOperatorBackedService = (
  obj: K8sResourceKind,
  installedOperators: ClusterServiceVersionKind[],
): boolean => {
  const kind = _.get(obj, 'metadata.ownerReferences[0].kind', null);
  const ownerUid = _.get(obj, 'metadata.ownerReferences[0].uid');
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  return !!(
    kind &&
    operatorBackedServiceKindMap &&
    (!_.isEmpty(operatorResource) || kind in operatorBackedServiceKindMap)
  );
};

import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, K8sModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '../utils/operator-utils';

// Minimal local model, kept so this hook does not depend on OLM being
// installed/present in the console build.
const ClusterServiceVersionModel: K8sModel = {
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  kind: 'ClusterServiceVersion',
  plural: 'clusterserviceversions',
  label: 'ClusterServiceVersion',
  labelPlural: 'ClusterServiceVersions',
  abbr: 'CSV',
};

type CsvWatchResource = {
  csvData: ClusterServiceVersionKind[];
  csvLoaded: boolean;
  csvError: {};
};
export const useCsvWatchResource = (ns: string): CsvWatchResource => {
  const csvResource = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace: ns,
      optional: true,
    }),
    [ns],
  );

  const [csvData, csvLoaded, csvError] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    csvResource,
  );
  return { csvData, csvLoaded, csvError };
};

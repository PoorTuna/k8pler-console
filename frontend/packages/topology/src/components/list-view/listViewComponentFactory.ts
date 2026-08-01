/* eslint-disable import/no-cycle */
import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import TopologyListViewNode from './TopologyListViewNode';

// Upstream dispatches to Knative/kubevirt/Helm/operator-group list-view renderers here, none of
// which exist on vanilla Kubernetes (Knative, kubevirt, and OLM-based operator grouping were all
// removed from this fork; Helm releases get their own admin-perspective page instead of a
// topology group). Every node in this fork is a plain workload.
export const listViewNodeComponentFactory = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type,
): React.ComponentType<{
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}> => TopologyListViewNode;

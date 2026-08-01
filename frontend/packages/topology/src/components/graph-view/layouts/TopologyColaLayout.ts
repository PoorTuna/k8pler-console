import { ColaLayout, Graph, GraphModel } from '@patternfly/react-topology';

// Upstream overrides getConstraints() here to add Knative revision traffic-splitting layout
// constraints. There are no Knative node types on vanilla Kubernetes, so this falls back to
// ColaLayout's own getConstraints().
class TopologyColaLayout extends ColaLayout {
  protected startLayout(
    graph: Graph<GraphModel, any>,
    initialRun: boolean,
    addingNodes: boolean,
  ): void {
    if (graph.getNodes()?.filter((n) => n.isVisible()).length === 0) {
      return;
    }
    super.startLayout(graph, initialRun, addingNodes);
  }
}

export default TopologyColaLayout;

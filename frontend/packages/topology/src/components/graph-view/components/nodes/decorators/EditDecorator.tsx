import * as React from 'react';
import { Node } from '@patternfly/react-topology';

interface DefaultDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

// Upstream shows a "Edit source code" decorator for workloads deployed via the S2I "Add from
// git" flow, driven by `vcsURI`/`editURL` annotations that flow sets. That flow doesn't exist on
// vanilla Kubernetes, so no workload here ever carries them -- keep the registration point (see
// defaultDecoratorsPlugin.ts) but always render nothing.
const EditDecorator: React.FC<DefaultDecoratorProps> = () => null;

export default EditDecorator;

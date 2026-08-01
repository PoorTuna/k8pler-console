import * as React from 'react';
import {
  Edge,
  EdgeTerminalType,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import BaseEdge from './BaseEdge';

import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

// Upstream draws a red error cross on this edge when the Service Binding Operator's
// ServiceBindingRequest reports an error. That operator is OLM-installed and isn't part of this
// fork, so `sbr` is never populated here -- draw a plain connector.
const ServiceBinding: React.FC<ServiceBindingProps> = (props) => (
  <BaseEdge className="odc-service-binding" endTerminalType={EdgeTerminalType.directional} {...props} />
);

export default observer(ServiceBinding);

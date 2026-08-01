import * as React from 'react';
import { GraphElement, BaseEdge, isEdge, isNode } from '@patternfly/react-topology';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING } from '../../const';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologySideBarContent from './TopologySideBarContent';

export const isSidebarRenderable = (selectedEntity: GraphElement): boolean => {
  if (isNode(selectedEntity) || isEdge(selectedEntity)) {
    return true;
  }
  return false;
};

export const SelectedEntityDetails: React.FC<{ selectedEntity: GraphElement }> = ({
  selectedEntity,
}) => {
  if (!selectedEntity) {
    return null;
  }

  if (isNode(selectedEntity)) {
    return <TopologySideBarContent element={selectedEntity} />;
  }

  if (isEdge(selectedEntity)) {
    if ([TYPE_SERVICE_BINDING, TYPE_CONNECTS_TO].includes(selectedEntity.getType())) {
      return <TopologySideBarContent element={selectedEntity} />;
    }

    return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
  }
  return null;
};

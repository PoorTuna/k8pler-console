import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import EditDecorator from './EditDecorator';
import MonitoringAlertsDecorator from './MonitoringAlertsDecorator';
import UrlDecorator from './UrlDecorator';

export const getEditDecorator = (element: Node, radius: number, x: number, y: number) => {
  return <EditDecorator key="edit" element={element} radius={radius} x={x} y={y} />;
};

export const getUrlDecorator = (element: Node, radius: number, x: number, y: number) => {
  return <UrlDecorator key="url" element={element} radius={radius} x={x} y={y} />;
};

export const getAlertsDecorator = (element: Node, radius: number, x: number, y: number) => {
  return <MonitoringAlertsDecorator key="alerts" element={element} radius={radius} x={x} y={y} />;
};

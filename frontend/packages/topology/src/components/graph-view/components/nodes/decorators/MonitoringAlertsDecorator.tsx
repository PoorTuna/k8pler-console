import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Node, SELECTION_EVENT } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  getSeverityAlertType,
  getFiringAlerts,
  AlertSeverityIcon,
  shouldHideMonitoringAlertDecorator,
} from '@console/shared';
import Decorator from './Decorator';

interface MonitoringAlertsDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

// Upstream also switches the sidebar to its "Observe" tab here via the
// UI.overview.selectedDetailsTab redux slice, which was dev-console's project-overview sidebar
// state and was removed with the rest of dev-console (see SideBarBody.tsx). Clicking the
// decorator still opens the sidebar, just on whichever tab was last selected.
const MonitoringAlertsDecorator: React.FC<MonitoringAlertsDecoratorProps> = ({
  element,
  radius,
  x,
  y,
}) => {
  const ref = React.useRef();
  const { t } = useTranslation();
  const workloadData = element.getData().data;
  const { monitoringAlerts } = workloadData;
  const firingAlerts = getFiringAlerts(monitoringAlerts);
  const severityAlertType = getSeverityAlertType(firingAlerts);

  const showSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    element.getGraph().getController().fireEvent(SELECTION_EVENT, [element.getId()]);
  };

  if (shouldHideMonitoringAlertDecorator(severityAlertType)) return null;

  const label = t('topology~Monitoring alert');
  return (
    <Tooltip triggerRef={ref} key="monitoringAlert" content={label} position={TooltipPosition.left}>
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} onClick={showSidebar} ariaLabel={label}>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
            <AlertSeverityIcon severityAlertType={severityAlertType} fontSize={radius} />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};

export default MonitoringAlertsDecorator;

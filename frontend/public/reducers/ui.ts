import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { ActionType, UIAction } from '../actions/ui';
import { ALL_APPLICATIONS_KEY, ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { getNamespace } from '../components/utils/link';
import { RootState } from '../redux';
import { getUser } from '@console/dynamic-plugin-sdk';

export type UIState = ImmutableMap<string, any>;

export default (state: UIState, action: UIAction): UIState => {
  if (!state) {
    const { pathname } = window.location;
    return ImmutableMap({
      activeNavSectionId: 'workloads',
      location: pathname,
      showOperandsInAllNamespaces: true,
      activeNamespace: ALL_NAMESPACES_KEY,
      activeApplication: ALL_APPLICATIONS_KEY,
      createProjectMessage: '',
      serviceLevel: ImmutableMap({
        level: '',
        daysRemaining: null,
        trialDateEnd: null,
        hasSecretAccess: false,
        clusterID: '',
      }),
      user: {},
      utilizationDuration: ImmutableMap({
        duration: null,
        endTime: null,
        selectedKey: null,
      }),
      deprecatedOperator: ImmutableMap({
        package: null,
        channel: null,
        version: null,
      }),
    });
  }

  switch (action.type) {
    case ActionType.SetActiveApplication:
      return state.set('activeApplication', action.payload.application);

    case ActionType.SetActiveNamespace:
      if (!action.payload.namespace) {
        // eslint-disable-next-line no-console
        console.warn('setActiveNamespace: Not setting to falsy!');
        return state;
      }

      return state
        .set('activeApplication', ALL_APPLICATIONS_KEY)
        .set('activeNamespace', action.payload.namespace);

    case ActionType.SetCurrentLocation: {
      state = state.set('location', action.payload.location);
      const ns = getNamespace(action.payload.location);
      if (_.isUndefined(ns)) {
        return state;
      }
      return state.set('activeNamespace', ns);
    }
    case ActionType.SetServiceLevel:
      return state.set('serviceLevel', {
        level: action.payload.serviceLevel,
        daysRemaining: action.payload.daysRemaining,
        clusterID: action.payload.clusterID,
        trialDateEnd: action.payload.trialDateEnd,
        hasSecretAccess: action.payload.hasSecretAccess,
      });

    case ActionType.SortList:
      return state.mergeIn(
        ['listSorts', action.payload.listId],
        _.pick(action.payload, ['field', 'func', 'orderBy']),
      );

    case ActionType.SetCreateProjectMessage:
      return state.set('createProjectMessage', action.payload.message);

    case ActionType.SetClusterID:
      return state.set('clusterID', action.payload.clusterID);

    case ActionType.NotificationDrawerToggleExpanded:
      return state.setIn(
        ['notifications', 'isExpanded'],
        !state.getIn(['notifications', 'isExpanded']),
      );

    case ActionType.UpdateTimestamps:
      return state.set('lastTick', action.payload.lastTick);

    case ActionType.SetPodMetrics:
      return state.setIn(['metrics', 'pod'], action.payload.podMetrics);

    case ActionType.SetNamespaceMetrics:
      return state.setIn(['metrics', 'namespace'], action.payload.namespaceMetrics);
    case ActionType.SetNodeMetrics:
      return state.setIn(['metrics', 'node'], action.payload.nodeMetrics);
    case ActionType.SetPVCMetrics:
      return state.setIn(['metrics', 'pvc'], action.payload.pvcMetrics);
    case ActionType.SetUtilizationDuration:
      return state.setIn(['utilizationDuration', 'duration'], action.payload.duration);
    case ActionType.SetUtilizationDurationSelectedKey:
      return state.setIn(['utilizationDuration', 'selectedKey'], action.payload.key);
    case ActionType.SetUtilizationDurationEndTime:
      return state.setIn(['utilizationDuration', 'endTime'], action.payload.endTime);
    case ActionType.SetShowOperandsInAllNamespaces:
      return state.set('showOperandsInAllNamespaces', action.payload.value);
    default:
      break;
  }
  return state;
};

export const createProjectMessageStateToProps = ({ UI }: RootState) => {
  return { createProjectMessage: UI.get('createProjectMessage') as string };
};

export const userStateToProps = (state: RootState) => {
  return { user: getUser(state) };
};

export const getActiveNamespace = ({ UI }: RootState): string => UI.get('activeNamespace');

export const getActiveApplication = ({ UI }: RootState): string => UI.get('activeApplication');

import * as _ from 'lodash';
import i18next from 'i18next';
import { K8sModel, k8sPatch, K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../const';
import { listInstanceResources } from './connector-utils';

// Note: upstream also exports `cleanUpWorkload` here -- a "delete this workload and everything
// dev-console's Add flow deployed alongside it" (BuildConfig, Route, Pipeline, webhooks, Knative
// Service...) helper. It was only ever called from dev-console's own "Delete Application" bulk
// action, which doesn't exist in this fork, and every one of those resource types is
// OpenShift/Knative/Pipelines-only, so it's dropped rather than stripped down.

export const sanitizeApplicationValue = (
  application: string,
  applicationType: string = application,
): string => {
  switch (applicationType) {
    case UNASSIGNED_KEY:
    case CREATE_APPLICATION_KEY:
      return '';
    default:
      return application;
  }
};

// Updates the resource's labels to set its application grouping
const updateItemAppLabel = (
  resourceKind: K8sModel,
  item: K8sResourceKind,
  application: string,
): Promise<any> => {
  const labels = { ...item.metadata.labels, 'app.kubernetes.io/part-of': application || undefined };

  if (!resourceKind) {
    return Promise.reject();
  }

  const patch = [
    {
      op: _.isEmpty(labels) ? 'add' : 'replace',
      path: '/metadata/labels',
      value: labels,
    },
  ];

  return k8sPatch(resourceKind, item, patch);
};

// Updates the given resource and its associated resources to the given application grouping
export const updateResourceApplication = (
  resourceKind: K8sModel,
  resource: K8sResourceKind,
  application: string,
): Promise<any> => {
  if (!resource) {
    return Promise.reject(
      new Error(i18next.t('topology~Error: no resource provided to update application for.')),
    );
  }
  if (!resourceKind) {
    return Promise.reject(
      new Error(
        i18next.t('topology~Error: invalid resource kind provided for updating application.'),
      ),
    );
  }

  const instanceName = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/instance']);
  const prevApplication = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

  const patches: Promise<any>[] = [updateItemAppLabel(resourceKind, resource, application)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // selector is for the instance name and current application if there is one
  const labelSelector = {
    'app.kubernetes.io/instance': instanceName,
  };
  if (prevApplication) {
    labelSelector['app.kubernetes.io/part-of'] = prevApplication;
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(resource.metadata.namespace, instanceName, {
    'app.kubernetes.io/part-of': prevApplication,
  }).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        // verify the case of no previous application
        if (prevApplication || !_.get(item, ['metadata', 'labels', 'app.kubernetes.io/part-of'])) {
          patches.push(updateItemAppLabel(modelFor(item.kind), item, application));
        }
      });
    });

    return Promise.all(patches);
  });
};

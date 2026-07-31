import * as _ from 'lodash-es';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { resourceListPathFromModel, withHandlePromise, HandlePromiseProps } from '../utils';
import { k8sKill, K8sResourceKind, K8sModel, K8sResourceCommon } from '../../module/k8s/';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { LocationDescriptor } from 'history';

//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
export const DeleteModal = withHandlePromise((props: DeleteModalProps & HandlePromiseProps) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = React.useState(true);
  const [isDeleteOtherResourcesChecked, setIsDeleteOtherResourcesChecked] = React.useState(true);

  const { t } = useTranslation();

  const submit = (event) => {
    event.preventDefault();
    const { kind, resource, deleteAllResources } = props;

    //https://kubernetes.io/docs/concepts/workloads/controllers/garbage-collection/
    const propagationPolicy = isChecked && kind ? kind.propagationPolicy : 'Orphan';
    const json = propagationPolicy
      ? { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
      : undefined;

    props.handlePromise(k8sKill(kind, resource, {}, {}, json), () => {
      props?.close && props.close();

      if (deleteAllResources && isDeleteOtherResourcesChecked) {
        deleteAllResources();
      }

      // If we are currently on the deleted resource's page, redirect to the resource list page
      const re = new RegExp(`/${resource?.metadata?.name}(/|$)`);
      if (re.test(window.location.pathname)) {
        const listPath = props.redirectTo
          ? props.redirectTo
          : resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
        navigate(listPath);
      }
    });
  };

  const { kind, resource, message, errorMessage } = props;
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('public~Delete {{kind}}?', {
          kind: kind ? (kind.labelKey ? t(kind.labelKey) : kind.label) : '',
        })}
      </ModalTitle>
      <ModalBody className="modal-body">
        {message}
        <div>
          {_.has(resource.metadata, 'namespace') ? (
            <Trans t={t} ns="public">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">
                {{ resourceName: resource?.metadata?.name }}
              </strong>{' '}
              in namespace <strong>{{ namespace: resource?.metadata?.namespace }}</strong>?
            </Trans>
          ) : (
            <Trans t={t} ns="public">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">
                {{ resourceName: resource?.metadata?.name }}
              </strong>
              ?
            </Trans>
          )}
          {_.has(kind, 'propagationPolicy') && (
            <div className="checkbox">
              <label className="control-label">
                <input
                  type="checkbox"
                  onChange={() => setIsChecked(!isChecked)}
                  checked={!!isChecked}
                />
                {t('public~Delete dependent objects of this resource')}
              </label>
            </div>
          )}
          {props.deleteAllResources && (
            <div className="checkbox">
              <label className="control-label">
                <input
                  type="checkbox"
                  onChange={() => setIsDeleteOtherResourcesChecked(!isDeleteOtherResourcesChecked)}
                  checked={!!isDeleteOtherResourcesChecked}
                />
                {t('public~Delete other resources created by console')}
              </label>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitDanger
        submitText={props.btnText || t('public~Delete')}
        cancel={props.cancel}
      />
    </form>
  );
});

export const deleteModal = createModalLauncher(DeleteModal);

export type DeleteModalProps = {
  kind: K8sModel;
  resource: K8sResourceCommon;
  close?: () => void;
  redirectTo?: LocationDescriptor;
  message?: JSX.Element;
  cancel?: () => void;
  btnText?: React.ReactNode;
  deleteAllResources?: () => Promise<K8sResourceKind[]>;
};

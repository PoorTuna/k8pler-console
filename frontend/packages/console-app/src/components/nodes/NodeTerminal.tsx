import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { PodConnectLoader } from '@console/internal/components/pod';
import {
  Firehose,
  FirehoseResource,
  FirehoseResult,
  LoadingBox,
} from '@console/internal/components/utils';
import { NamespaceModel, PodModel } from '@console/internal/models';
import { NodeKind, PodKind, k8sCreate, k8sKillByName } from '@console/internal/module/k8s';

type NodeTerminalErrorProps = {
  error: React.ReactNode;
};

type NodeTerminalInnerProps = {
  obj?: FirehoseResult<PodKind>;
};

type NodeTerminalProps = {
  obj: NodeKind;
};

// Plain public debug image -- no OpenShift ImageStreamTag lookup, no
// registry.redhat.io fallback (which requires Red Hat registry auth and
// would ImagePullBackOff on a vanilla cluster anyway).
const DEBUG_IMAGE = 'busybox:1.36';

const getDebugPod = (
  name: string,
  namespace: string,
  nodeName: string,
  isWindows: boolean,
): PodKind => {
  const image = DEBUG_IMAGE;
  const template: PodKind = {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
    },
    spec: {
      containers: [
        {
          command: ['/bin/sh'],
          env: [
            {
              // Set the Shell variable to auto-logout after 15m idle timeout
              name: 'TMOUT',
              value: '900',
            },
            {
              // this env requires to be set in order to collect more sos reports
              name: 'HOST',
              value: '/host',
            },
          ],
          image,
          name: 'container-00',
          resources: {},
          securityContext: {
            privileged: true,
            runAsUser: 0,
          },
          stdin: true,
          stdinOnce: true,
          tty: true,
          volumeMounts: [
            {
              name: 'host',
              mountPath: '/host',
            },
          ],
        },
      ],
      hostIPC: true,
      hostPID: true,
      hostNetwork: true,
      nodeName,
      restartPolicy: 'Never',
      volumes: [
        {
          name: 'host',
          hostPath: {
            path: '/',
            type: 'Directory',
          },
        },
      ],
    },
  };

  if (isWindows) {
    template.spec.OS = 'windows';
    template.spec.hostPID = false;
    template.spec.hostIPC = false;
    const containerUser = 'ContainerUser';
    template.spec.containers[0].securityContext = {
      windowsOptions: {
        runAsUserName: containerUser,
      },
    };
  }
  return template;
};

const NodeTerminalError: React.FC<NodeTerminalErrorProps> = ({ error }) => {
  return (
    <div className="co-m-pane__body">
      <Alert variant="danger" isInline title={error} data-test="node-terminal-error" />
    </div>
  );
};

const NodeTerminalInner: React.FC<NodeTerminalInnerProps> = ({ obj }) => {
  const { t } = useTranslation();
  const message = (
    <Trans t={t} ns="console-app">
      <p>
        To use host binaries, run <code className="co-code">chroot /host</code>
      </p>
    </Trans>
  );
  switch (obj?.data?.status?.phase) {
    case 'Failed':
      return (
        <NodeTerminalError
          error={
            <>
              {t('console-app~The debug pod failed. ')}
              {obj?.data?.status?.containerStatuses?.[0]?.state?.terminated?.message ||
                obj?.data?.status?.message}
            </>
          }
        />
      );
    case 'Running':
      return <PodConnectLoader obj={obj.data} message={message} attach />;
    default:
      return <LoadingBox />;
  }
};

const NodeTerminal: React.FC<NodeTerminalProps> = ({ obj: node }) => {
  const [resources, setResources] = React.useState<FirehoseResource[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const nodeName = node.metadata.name;
  const isWindows = node.status?.nodeInfo?.operatingSystem === 'windows';

  React.useEffect(() => {
    let namespace;
    const name = `${nodeName?.replace(/\./g, '-')}-debug`;
    const deleteNamespace = async (ns) => {
      try {
        await k8sKillByName(NamespaceModel, ns);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not delete node terminal debug namespace.', e);
      }
    };
    const closeTab = (event) => {
      event.preventDefault();
      deleteNamespace(namespace.metadata.name);
    };
    const createDebugPod = async () => {
      try {
        namespace = await k8sCreate(NamespaceModel, {
          metadata: {
            generateName: 'k8pler-debug-',
            labels: {
              'pod-security.kubernetes.io/audit': 'privileged',
              'pod-security.kubernetes.io/enforce': 'privileged',
              'pod-security.kubernetes.io/warn': 'privileged',
            },
          },
        });
        const podToCreate = getDebugPod(name, namespace.metadata.name, nodeName, isWindows);
        // wait for the namespace to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const debugPod = await k8sCreate(PodModel, podToCreate);
        if (debugPod) {
          setResources([
            {
              isList: false,
              kind: 'Pod',
              name,
              namespace: namespace.metadata.name,
              prop: 'obj',
            },
          ]);
        }
      } catch (e) {
        setErrorMessage(e.message);
        if (namespace) {
          deleteNamespace(namespace.metadata.name);
        }
      }
    };
    createDebugPod();
    window.addEventListener('beforeunload', closeTab);
    return () => {
      deleteNamespace(namespace.metadata.name);
      window.removeEventListener('beforeunload', closeTab);
    };
  }, [nodeName, isWindows]);

  return errorMessage ? (
    <NodeTerminalError error={errorMessage} />
  ) : (
    <Firehose resources={resources}>
      <NodeTerminalInner />
    </Firehose>
  );
};

export default NodeTerminal;

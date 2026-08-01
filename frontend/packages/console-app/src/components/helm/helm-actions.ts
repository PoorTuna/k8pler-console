import { confirmModal } from '@console/internal/components/modals';
import { rollbackHelmRelease, uninstallHelmRelease } from './helm-api';

export const openRollbackModal = (
  namespace: string,
  name: string,
  revision: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
) =>
  confirmModal({
    title: t('public~Rollback {{name}}', { name }),
    message: t('public~Roll back to revision {{revision}}? This redeploys that revision\'s chart and values.', {
      revision,
    }),
    btnText: t('public~Rollback'),
    executeFn: () => rollbackHelmRelease(namespace, name, revision),
  });

export const openUninstallModal = (
  namespace: string,
  name: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
) =>
  confirmModal({
    title: t('public~Uninstall {{name}}', { name }),
    message: t(
      'public~Uninstall release {{name}}? This deletes every resource it deployed and cannot be undone.',
      { name },
    ),
    btnText: t('public~Uninstall'),
    submitDanger: true,
    executeFn: () => uninstallHelmRelease(namespace, name),
  });

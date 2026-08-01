import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { HelmRelease } from './helm-types';

// Thin wrappers around the /api/helm/* routes registered in pkg/server/server.go. The backend
// scopes every one of these calls to a single namespace (Helm's own storage driver has no
// all-namespaces mode wired up here) -- callers must always pass a real namespace.

export const listHelmReleases = (namespace: string): Promise<HelmRelease[]> =>
  consoleFetchJSON(`/api/helm/releases?ns=${encodeURIComponent(namespace)}`);

export const getHelmRelease = (namespace: string, name: string): Promise<HelmRelease> =>
  consoleFetchJSON(
    `/api/helm/release?ns=${encodeURIComponent(namespace)}&name=${encodeURIComponent(name)}`,
  );

export const getHelmReleaseHistory = (namespace: string, name: string): Promise<HelmRelease[]> =>
  consoleFetchJSON(
    `/api/helm/release/history?ns=${encodeURIComponent(namespace)}&name=${encodeURIComponent(
      name,
    )}`,
  );

export const uninstallHelmRelease = (namespace: string, name: string): Promise<HelmRelease> =>
  consoleFetchJSON.delete(
    `/api/helm/release?ns=${encodeURIComponent(namespace)}&name=${encodeURIComponent(name)}`,
  );

export const rollbackHelmRelease = (
  namespace: string,
  name: string,
  version: number,
): Promise<HelmRelease> =>
  consoleFetchJSON.patch('/api/helm/release', { name, namespace, version });

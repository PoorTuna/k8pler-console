// Mirrors helm.sh/helm/v3/pkg/release.Release (and its History JSON), the shape returned by
// the console's Helm backend (pkg/helm/). Only the fields the UI needs are typed.

export type HelmChartMetadata = {
  name: string;
  version: string;
  appVersion?: string;
  description?: string;
  icon?: string;
};

export type HelmReleaseInfo = {
  status: string;
  description?: string;
  first_deployed?: string;
  last_deployed?: string;
  notes?: string;
};

export type HelmRelease = {
  name: string;
  namespace: string;
  version: number;
  info: HelmReleaseInfo;
  chart: {
    metadata: HelmChartMetadata;
  };
  manifest?: string;
};

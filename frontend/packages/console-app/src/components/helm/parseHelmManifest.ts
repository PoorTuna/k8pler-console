export type ManifestResource = {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
};

// Best-effort split of a rendered Helm manifest (release.manifest -- the concatenated YAML
// documents Helm applied) into a flat list of kind/name pairs for display. Doesn't attempt a
// real YAML parse: manifests can contain Go-template leftovers and multi-doc separators that
// trip up strict parsers, and all the Resources tab needs is enough to link to each object.
export const parseHelmManifest = (manifest: string): ManifestResource[] => {
  if (!manifest) {
    return [];
  }
  return manifest
    .split(/^---\s*$/m)
    .map((doc) => {
      const apiVersion = doc.match(/^apiVersion:\s*(\S+)/m)?.[1];
      const kind = doc.match(/^kind:\s*(\S+)/m)?.[1];
      const metadataMatch = doc.match(/^metadata:\n([\s\S]*?)(?:\n\S|$)/m);
      const metadataBlock = metadataMatch?.[1] ?? doc;
      const name = metadataBlock.match(/^\s+name:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
      const namespace = metadataBlock
        .match(/^\s+namespace:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]
        ?.trim();
      return kind && name ? ({ apiVersion, kind, name, namespace } as ManifestResource) : null;
    })
    .filter((resource): resource is ManifestResource => resource !== null);
};

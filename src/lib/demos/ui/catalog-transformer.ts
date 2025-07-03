/**
 * Utilities for transforming version catalog data
 */
import { type VersionHistory } from '#lib/version-history/index'

export interface CatalogDeploymentData {
  trunkDeployments: {
    latest: {
      sha: string
      shortSha: string
      tag: string
    } | null
    previous: Array<{
      sha: string
      shortSha: string
      tag: string
    }>
  }
  distTags: Record<string, string>
}

/**
 * Transforms version catalog into deployment data structure
 */
export function transformCatalogToDeployments(catalog: VersionHistory.Catalog): CatalogDeploymentData {
  const latestStable = catalog.distTags.latest || catalog.stable[0] || null

  const trunkDeployments = {
    latest: latestStable
      ? {
        sha: latestStable.git.sha,
        shortSha: latestStable.git.sha.substring(0, 7),
        tag: latestStable.git.tag,
      }
      : null,
    previous: catalog.versions
      .filter(v => v.git.tag !== latestStable?.git.tag)
      .slice(0, 10)
      .map(v => ({
        sha: v.git.sha,
        shortSha: v.git.sha.substring(0, 7),
        tag: v.git.tag,
      })),
  }

  const distTags: Record<string, string> = {}
  for (const [name, version] of Object.entries(catalog.distTags)) {
    if (version) {
      distTags[name] = version.git.tag
    }
  }

  return { trunkDeployments, distTags }
}

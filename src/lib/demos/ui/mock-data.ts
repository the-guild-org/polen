/**
 * Mock data constants for development mode
 */
import type { DistTagsData, TrunkDeploymentsData } from './data-collector.ts'

export const MOCK_TRUNK_DEPLOYMENTS: TrunkDeploymentsData = {
  latest: { sha: `1.2.0`, shortSha: `1.2.0`, tag: `1.2.0` },
  previous: [
    { sha: `1.1.0`, shortSha: `1.1.0`, tag: `1.1.0` },
    { sha: `1.0.0`, shortSha: `1.0.0`, tag: `1.0.0` },
    { sha: `0.9.1`, shortSha: `0.9.1`, tag: `0.9.1` },
    { sha: `0.9.0`, shortSha: `0.9.0`, tag: `0.9.0` },
  ],
}

export const MOCK_DIST_TAGS: DistTagsData = {
  latest: `1.2.0`,
  next: `1.3.0-beta.2`,
}

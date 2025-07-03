/**
 * Pure functions for transforming demo data
 */
import type { DemoConfig } from '../config.ts'
import { getOrderedDemos } from '../config.ts'
import type { DemoMetadata } from './data-collector.ts'
import type { Demo, DemoPageData, PrDeployments, TrunkDeployments } from './types.ts'

/**
 * Transforms demo metadata and examples into Demo array
 */
export function transformDemoMetadata(
  demoConfig: DemoConfig,
  demoExamples: string[],
  demoMetadata: Record<string, DemoMetadata>,
): Demo[] {
  const orderedExamples = getOrderedDemos(demoConfig, demoExamples)
  const allDemos: Demo[] = []

  // Add enabled demos first (in order)
  for (const name of orderedExamples) {
    const metadata = demoMetadata[name]
    if (metadata) {
      allDemos.push({
        name,
        title: metadata.title,
        description: metadata.description,
        enabled: metadata.enabled,
        reason: metadata.reason,
      })
    }
  }

  // Add disabled demos
  for (const [name, metadata] of Object.entries(demoMetadata)) {
    if (!metadata.enabled && !orderedExamples.includes(name)) {
      allDemos.push({
        name,
        title: metadata.title,
        description: metadata.description,
        enabled: metadata.enabled,
        reason: metadata.reason,
      })
    }
  }

  return allDemos
}

/**
 * Creates deployment data structure based on PR or trunk mode
 */
export function createDeploymentsData(
  config: { prNumber?: string; currentSha?: string },
  data: {
    prDeployments?: Array<{ number: number; sha?: string; ref?: string; previousDeployments?: string[] }>
    trunkDeployments?: {
      latest: { sha: string; shortSha: string; tag: string | null } | null
      previous: Array<{ sha: string; shortSha: string; tag: string | null }>
    }
    distTags?: Record<string, string>
  },
): TrunkDeployments | PrDeployments {
  if (config.prNumber) {
    return {
      type: 'pr',
      prNumber: config.prNumber,
      currentSha: config.currentSha,
      deployments: data.prDeployments || [],
    }
  }

  return {
    type: 'trunk',
    distTags: data.distTags || {},
    latest: data.trunkDeployments?.latest || undefined,
    previous: data.trunkDeployments?.previous || [],
  }
}

/**
 * Creates the final DemoPageData structure
 */
export function createDemoPageData(
  config: { basePath: string; prNumber?: string; currentSha?: string },
  demoConfig: DemoConfig,
  demos: Demo[],
  deployments: TrunkDeployments | PrDeployments,
): DemoPageData {
  return {
    theme: demoConfig.ui.theme,
    content: demoConfig.ui.content,
    repo: {
      owner: process.env['GITHUB_REPOSITORY_OWNER'] || 'the-guild-org',
      name: process.env['GITHUB_REPOSITORY']?.split('/')[1] || 'polen',
    },
    basePath: config.basePath,
    prNumber: config.prNumber,
    currentSha: config.currentSha,
    demos,
    deployments,
  }
}

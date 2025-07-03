/**
 * Unified types for demo UI
 */
import type { VersionHistory } from '#lib/version-history/index'

export interface BuildConfigBase {
  basePath?: string
  outputDir?: string
  outputPath?: string
}

export type BuildConfig =
  | (BuildConfigBase & {
    mode: 'trunk'
    catalog: VersionHistory.Catalog
  })
  | (BuildConfigBase & {
    mode: 'preview'
    prNumber: string
    currentSha?: string
    prDeployments: Array<{
      number: number
      sha?: string
      ref?: string
      previousDeployments?: string[]
    }>
  })

export interface DemoPageData {
  // From config
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  content: {
    title: string
    description: string
    logoUrl?: string
  }

  // Repository info
  repo: {
    owner: string
    name: string
  }

  // From data
  basePath: string
  prNumber?: string
  currentSha?: string

  // Demos
  demos: Demo[]

  // Discriminated union for deployments
  deployments: TrunkDeployments | PrDeployments
}

export interface Demo {
  name: string
  title: string
  description: string
  enabled: boolean
  reason?: string
}

export type TrunkDeployments = {
  type: 'trunk'
  distTags: Record<string, string>
  latest?: {
    sha: string
    shortSha: string
    tag: string | null
  }
  previous: Array<{
    sha: string
    shortSha: string
    tag: string | null
  }>
}

export type PrDeployments = {
  type: 'pr'
  prNumber: string
  currentSha?: string
  previousVersions: Array<{
    sha: string
    shortSha: string
  }>
}

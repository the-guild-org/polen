/**
 * Data collection for demo landing pages
 */

import { Str } from '@wollybeard/kit'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getDisabledExamples, loadConfig } from '../config.ts'
import { getDemoExamples } from '../utils.ts'
import { MOCK_DIST_TAGS, MOCK_TRUNK_DEPLOYMENTS } from './mock-data.ts'

export interface DemoMetadata {
  title: string
  description: string
  enabled: boolean
  reason?: string
}

export interface TrunkDeployment {
  sha: string
  shortSha: string
  tag: string | null
}

export interface TrunkDeploymentsData {
  latest: TrunkDeployment | null
  previous: TrunkDeployment[]
}

export interface PrDeployment {
  number: number
  sha?: string
  ref?: string
  previousDeployments?: string[]
}

export interface DistTagsData {
  [key: string]: string
}

export interface LandingPageData {
  demoMetadata: Record<string, DemoMetadata>
  demoExamples: string[]
  trunkDeployments?: TrunkDeploymentsData
  prDeployments?: PrDeployment[]
  distTags?: DistTagsData
  config: {
    basePath: string
    mode: `production` | `development`
    prNumber?: string
    currentSha?: string
  }
}

/**
 * Collects all data needed for generating demo landing pages
 */
export class DemoDataCollector {
  constructor(private workingDir: string = process.cwd()) {}

  /**
   * Collect all data for landing page generation
   */
  async collectLandingPageData(options: {
    mode?: `production` | `development`
    basePath?: string
    prNumber?: string
    currentSha?: string
    trunkDeployments?: string | TrunkDeploymentsData
    prDeployments?: string | PrDeployment[]
    distTags?: string | DistTagsData
  }): Promise<LandingPageData> {
    try {
      const {
        mode = `production`,
        basePath = `/`,
        prNumber,
        currentSha,
        trunkDeployments,
        prDeployments,
        distTags,
      } = options

      // Get demo examples
      const demoExamples = await this.getDemoExamples()

      // Load demo metadata
      const demoMetadata = await this.loadDemoMetadata(demoExamples)

      // Parse deployment data based on mode
      const parsedTrunkDeployments = mode === `development`
        ? MOCK_TRUNK_DEPLOYMENTS
        : this.parseJsonData<TrunkDeploymentsData>(trunkDeployments)

      const parsedPrDeployments = this.parseJsonData<PrDeployment[]>(prDeployments)

      const parsedDistTags = mode === `development`
        ? MOCK_DIST_TAGS
        : this.parseJsonData<DistTagsData>(distTags)

      return {
        demoMetadata,
        demoExamples,
        trunkDeployments: parsedTrunkDeployments,
        prDeployments: parsedPrDeployments,
        distTags: parsedDistTags,
        config: {
          mode,
          basePath,
          prNumber,
          currentSha,
        },
      }
    } catch (error) {
      throw new Error(`Failed to collect landing page data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get demo examples using existing utility
   */
  private async getDemoExamples(): Promise<string[]> {
    try {
      return await getDemoExamples()
    } catch (error) {
      throw new Error(`Failed to get demo examples: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Load metadata for all demos (enabled and disabled)
   */
  private async loadDemoMetadata(demoExamples: string[]): Promise<Record<string, DemoMetadata>> {
    const metadata: Record<string, DemoMetadata> = {}
    const config = await loadConfig()

    // Load metadata from package.json files for enabled examples
    for (const example of demoExamples) {
      try {
        const packageJsonPath = join(this.workingDir, `examples`, example, `package.json`)
        const packageJson = JSON.parse(readFileSync(packageJsonPath, `utf-8`))

        metadata[example] = {
          title: packageJson.displayName || Str.Case.title(packageJson.name || example),
          description: packageJson.description
            || `Explore the ${example} GraphQL API with comprehensive documentation.`,
          enabled: true,
        }
      } catch {
        // Fallback if package.json is missing or invalid
        metadata[example] = {
          title: Str.Case.title(example),
          description: `Explore the ${example} GraphQL API with comprehensive documentation.`,
          enabled: true,
        }
      }
    }

    // Add disabled demos from configuration
    const disabledExamples = getDisabledExamples(config)
    for (const { example, reason } of disabledExamples) {
      metadata[example] = {
        title: Str.Case.title(example),
        description: `This demo is currently unavailable.`,
        enabled: false,
        reason,
      }
    }

    return metadata
  }

  /**
   * Generic JSON parser
   */
  private parseJsonData<T>(data?: string | T): T | undefined {
    if (!data) return undefined

    if (typeof data === `string`) {
      try {
        return JSON.parse(data) as T
      } catch {
        return undefined
      }
    }

    return data
  }
}

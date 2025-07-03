/**
 * Data collection for demo landing pages
 */

import { Str } from '@wollybeard/kit'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getDisabledDemos, loadConfig } from '../config.ts'
import { getDemoExamples } from '../utils.ts'

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
        ? this.getMockTrunkDeployments()
        : this.parseTrunkDeployments(trunkDeployments)

      const parsedPrDeployments = this.parsePrDeployments(prDeployments)

      const parsedDistTags = mode === `development`
        ? this.getMockDistTags()
        : this.parseDistTags(distTags)

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
    const disabledDemos = getDisabledDemos(config)
    for (const [name, disabledDemo] of Object.entries(disabledDemos)) {
      metadata[name] = {
        title: disabledDemo.title,
        description: disabledDemo.description,
        enabled: false,
        reason: disabledDemo.reason,
      }
    }

    return metadata
  }

  /**
   * Parse trunk deployments from JSON string or object
   */
  private parseTrunkDeployments(trunkDeployments?: string | TrunkDeploymentsData): TrunkDeploymentsData | undefined {
    if (!trunkDeployments) return undefined

    if (typeof trunkDeployments === `string`) {
      try {
        return JSON.parse(trunkDeployments) as TrunkDeploymentsData
      } catch {
        return undefined
      }
    }

    return trunkDeployments
  }

  /**
   * Parse PR deployments from JSON string or array
   */
  private parsePrDeployments(prDeployments?: string | PrDeployment[]): PrDeployment[] | undefined {
    if (!prDeployments) return undefined

    if (typeof prDeployments === `string`) {
      try {
        return JSON.parse(prDeployments) as PrDeployment[]
      } catch {
        return undefined
      }
    }

    return prDeployments
  }

  /**
   * Parse dist-tags from JSON string or object
   */
  private parseDistTags(distTags?: string | DistTagsData): DistTagsData | undefined {
    if (!distTags) return undefined

    if (typeof distTags === `string`) {
      try {
        return JSON.parse(distTags) as DistTagsData
      } catch {
        return undefined
      }
    }

    return distTags
  }

  /**
   * Get mock data for development mode
   */
  private getMockTrunkDeployments(): TrunkDeploymentsData {
    return {
      latest: { sha: `1.2.0`, shortSha: `1.2.0`, tag: `1.2.0` },
      previous: [
        { sha: `1.1.0`, shortSha: `1.1.0`, tag: `1.1.0` },
        { sha: `1.0.0`, shortSha: `1.0.0`, tag: `1.0.0` },
        { sha: `0.9.1`, shortSha: `0.9.1`, tag: `0.9.1` },
        { sha: `0.9.0`, shortSha: `0.9.0`, tag: `0.9.0` },
      ],
    }
  }

  /**
   * Get mock dist-tags for development mode
   */
  private getMockDistTags(): DistTagsData {
    return {
      latest: `1.2.0`,
      next: `1.3.0-beta.2`,
    }
  }
}

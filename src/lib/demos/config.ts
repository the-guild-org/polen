import { gte as semverGte, parse as semverParse } from '@vltpkg/semver'
import { readFileSync } from 'node:fs'
import type { DemoConfigData } from './config-schema.ts'
import { DemoConfigSchema, LegacyDemoConfigSchema } from './config-schema.ts'

// Try to import the TypeScript config
let importedConfig: DemoConfigData | null = null
try {
  // @ts-ignore - This import might fail if the file doesn't exist
  const configModule = await import(`../../../.github/demo-config.ts`)
  importedConfig = configModule.default || configModule.demoConfig
} catch {
  // Config file doesn't exist or failed to load
}

// Default configuration
const DEFAULT_CONFIG: DemoConfigData = {
  examples: {
    exclude: [],
    order: [],
    minimumPolenVersion: `0.1.0`,
  },
  deployment: {
    basePaths: {},
    redirects: [],
    gc: {
      retainStableVersions: true,
      retainCurrentCycle: true,
      retainDays: 30,
    },
  },
  ui: {
    theme: {
      primaryColor: `#000`,
      backgroundColor: `#fff`,
      textColor: `#000`,
      mutedTextColor: `#666`,
    },
    branding: {
      title: `Polen Demos`,
      description: `Interactive GraphQL API documentation`,
    },
  },
  metadata: {
    disabledDemos: {
      github: {
        title: `GitHub API`,
        description: `Browse GitHub's extensive GraphQL API with over 1600 types.`,
        reason: `Currently disabled due to build performance.`,
      },
    },
  },
}

export class DemoConfig {
  private data: DemoConfigData
  private configPath: string

  constructor(configPath = `.github/demo-config`) {
    this.configPath = configPath
    this.data = this.loadConfig()
  }

  private loadConfig(): DemoConfigData {
    // Check if we're loading the default config path and have an imported TypeScript config
    if (this.configPath === `.github/demo-config` && importedConfig) {
      const parsed = DemoConfigSchema.safeParse(importedConfig)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Try JSON config
    try {
      const jsonConfigPath = `${this.configPath}.json`
      const raw = JSON.parse(readFileSync(jsonConfigPath, `utf-8`))

      // Try to parse as modern config first
      const modernParse = DemoConfigSchema.safeParse(raw)
      if (modernParse.success) {
        return modernParse.data
      }

      // Fall back to legacy config format
      const legacyParse = LegacyDemoConfigSchema.safeParse(raw)
      if (legacyParse.success) {
        const legacy = legacyParse.data
        return {
          ...DEFAULT_CONFIG,
          examples: {
            ...DEFAULT_CONFIG.examples,
            exclude: legacy.excludeDemos || DEFAULT_CONFIG.examples.exclude,
            order: legacy.order || DEFAULT_CONFIG.examples.order,
            minimumPolenVersion: legacy.minimumPolenVersion || legacy.minimumVersion
              || DEFAULT_CONFIG.examples.minimumPolenVersion,
          },
        }
      }

      throw new Error(`Invalid config format`)
    } catch (e) {
      console.warn(`No config file found at ${this.configPath}.json, using defaults`)
      return DEFAULT_CONFIG
    }
  }

  get excludeDemos(): string[] {
    return this.data.examples.exclude
  }

  get minimumPolenVersion(): string {
    return this.data.examples.minimumPolenVersion
  }

  get order(): string[] {
    return this.data.examples.order
  }

  get fullConfig(): DemoConfigData {
    return this.data
  }

  /**
   * Check if a Polen version meets the minimum requirement
   */
  meetsMinimumPolenVersion(polenVersion: string): boolean {
    const versionParsed = semverParse(polenVersion)
    const minVersionParsed = semverParse(this.minimumPolenVersion)

    if (!versionParsed || !minVersionParsed) {
      return false
    }

    return semverGte(versionParsed, minVersionParsed)
  }

  /**
   * Check if a demo is excluded
   */
  isDemoExcluded(demoName: string): boolean {
    return this.data.examples.exclude.includes(demoName)
  }

  /**
   * Get ordered list of demos (non-excluded)
   * @param availableDemos List of all available demo names
   * @returns Ordered list with configured order first, then alphabetical
   */
  getOrderedDemos(availableDemos: string[]): string[] {
    const nonExcluded = availableDemos.filter(demo => !this.isDemoExcluded(demo))
    const orderedDemos: string[] = []
    const remainingDemos = [...nonExcluded]

    // Add demos in the specified order
    for (const demo of this.order) {
      if (nonExcluded.includes(demo)) {
        orderedDemos.push(demo)
        const index = remainingDemos.indexOf(demo)
        if (index > -1) {
          remainingDemos.splice(index, 1)
        }
      }
    }

    // Add remaining demos in alphabetical order
    remainingDemos.sort()
    orderedDemos.push(...remainingDemos)

    return orderedDemos
  }

  /**
   * Get deployment path for a version
   */
  getDeploymentPath(version: string, isStable = false): string {
    return isStable ? `/latest/` : `/${version}/`
  }

  /**
   * Get all disabled demos with metadata
   */
  getDisabledDemos(): Record<string, { title: string; description: string; reason?: string }> {
    return this.data.metadata.disabledDemos
  }
}

// Singleton instance for convenience
let defaultConfig: DemoConfig | null = null

export function getDemoConfig(configPath?: string): DemoConfig {
  if (configPath) {
    // Always create new instance when path is provided
    return new DemoConfig(configPath)
  }

  if (!defaultConfig) {
    defaultConfig = new DemoConfig()
  }
  return defaultConfig
}

// For testing only
export function resetDemoConfig(): void {
  defaultConfig = null
}

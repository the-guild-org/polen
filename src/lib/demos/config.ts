import { gte as semverGte, parse as semverParse } from '@vltpkg/semver'
import { readFileSync } from 'node:fs'

export interface DemoConfigData {
  excludeDemos: string[]
  minimumPolenVersion: string
  order: string[]
}

export class DemoConfig {
  private data: DemoConfigData
  private configPath: string

  constructor(configPath: string = '.github/demo-config.json') {
    this.configPath = configPath
    this.data = this.loadConfig()
  }

  private loadConfig(): DemoConfigData {
    try {
      const raw = JSON.parse(readFileSync(this.configPath, 'utf-8'))
      return {
        excludeDemos: raw.excludeDemos || [],
        // Support both old and new field names during migration
        minimumPolenVersion: raw.minimumPolenVersion || raw.minimumVersion || '0.0.0',
        order: raw.order || [],
      }
    } catch (e) {
      console.warn(`Could not read ${this.configPath}, using defaults`)
      return {
        excludeDemos: [],
        minimumPolenVersion: '0.0.0',
        order: [],
      }
    }
  }

  get excludeDemos(): string[] {
    return this.data.excludeDemos
  }

  get minimumPolenVersion(): string {
    return this.data.minimumPolenVersion
  }

  get order(): string[] {
    return this.data.order
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
    return this.data.excludeDemos.includes(demoName)
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

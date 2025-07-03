import type { DemoOptions } from '#lib/demos/config-options'
import { DemoOptionsSchema } from '#lib/demos/config-options'
import { gte as semverGte, parse as semverParse } from '@vltpkg/semver'
import { readFile } from 'node:fs/promises'
import { z } from 'zod/v4'

// Legacy schema for backward compatibility
const LegacyDemoConfigSchema = z.object({
  excludeDemos: z.array(z.string()).optional(),
  minimumVersion: z.string().optional(),
  minimumPolenVersion: z.string().optional(),
  order: z.array(z.string()).optional(),
})

export type DemoConfig = {
  examples: {
    exclude: string[]
    order: string[]
    minimumVersion: string
    disabled: Array<{ example: string; reason: string }>
  }
  deployment: {
    basePaths: Record<string, string>
    redirects: Array<{ from: string; to: string }>
    gc: {
      retainStableVersions: boolean
      retainCurrentCycle: boolean
      retainDays: number
    }
  }
  ui: {
    theme: {
      primaryColor: string
      backgroundColor: string
      textColor: string
      mutedTextColor: string
    }
    content: {
      title: string
      description: string
      logoUrl?: string
    }
  }
}

// Default configuration
export const DEFAULT_CONFIG: DemoConfig = {
  examples: {
    exclude: [],
    order: [],
    minimumVersion: `0.1.0`,
    disabled: [],
  },
  deployment: {
    basePaths: {
      '/latest/': `Stable releases`,
      '/next/': `Next/beta releases`,
    },
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
    content: {
      title: `Polen Demos`,
      description: `Interactive GraphQL API documentation`,
    },
  },
}

/**
 * Merge partial config with defaults
 */
export function mergeWithDefaults(config: Partial<DemoOptions>): DemoConfig {
  return {
    examples: {
      exclude: config.examples?.exclude !== undefined ? config.examples.exclude : DEFAULT_CONFIG.examples.exclude,
      order: config.examples?.order !== undefined ? config.examples.order : DEFAULT_CONFIG.examples.order,
      minimumVersion: config.examples?.minimumVersion !== undefined
        ? config.examples.minimumVersion
        : DEFAULT_CONFIG.examples.minimumVersion,
      disabled: config.examples?.disabled !== undefined ? config.examples.disabled : DEFAULT_CONFIG.examples.disabled,
    },
    deployment: {
      basePaths: config.deployment?.basePaths ?? DEFAULT_CONFIG.deployment.basePaths,
      redirects: config.deployment?.redirects ?? DEFAULT_CONFIG.deployment.redirects,
      gc: {
        retainStableVersions: config.deployment?.gc?.retainStableVersions
          ?? DEFAULT_CONFIG.deployment.gc.retainStableVersions,
        retainCurrentCycle: config.deployment?.gc?.retainCurrentCycle
          ?? DEFAULT_CONFIG.deployment.gc.retainCurrentCycle,
        retainDays: config.deployment?.gc?.retainDays ?? DEFAULT_CONFIG.deployment.gc.retainDays,
      },
    },
    ui: {
      theme: {
        primaryColor: config.ui?.theme?.primaryColor ?? DEFAULT_CONFIG.ui.theme.primaryColor,
        backgroundColor: config.ui?.theme?.backgroundColor ?? DEFAULT_CONFIG.ui.theme.backgroundColor,
        textColor: config.ui?.theme?.textColor ?? DEFAULT_CONFIG.ui.theme.textColor,
        mutedTextColor: config.ui?.theme?.mutedTextColor ?? DEFAULT_CONFIG.ui.theme.mutedTextColor,
      },
      content: {
        title: config.ui?.content?.title ?? DEFAULT_CONFIG.ui.content.title,
        description: config.ui?.content?.description ?? DEFAULT_CONFIG.ui.content.description,
        logoUrl: config.ui?.content?.logoUrl,
      },
    },
  }
}

/**
 * Load config from file (async)
 */
export async function loadConfig(configPath = `.github/demo-config`): Promise<DemoConfig> {
  // Try to import TypeScript config first
  if (configPath === `.github/demo-config`) {
    try {
      // @ts-ignore - This import might fail if the file doesn't exist
      const configModule = await import(`../../../.github/demo-config.ts`)
      const importedConfig = configModule.default || configModule.demoConfig

      const parsed = DemoOptionsSchema.safeParse(importedConfig)
      if (parsed.success) {
        return mergeWithDefaults(parsed.data)
      }
    } catch {
      // TypeScript config doesn't exist or failed to load
    }
  }

  // Try JSON config
  try {
    const jsonConfigPath = `${configPath}.json`
    const raw = JSON.parse(await readFile(jsonConfigPath, `utf-8`))

    // Try to parse as modern config first
    const modernParse = DemoOptionsSchema.safeParse(raw)
    if (modernParse.success) {
      return mergeWithDefaults(modernParse.data)
    }

    // Fall back to legacy config format
    const legacyParse = LegacyDemoConfigSchema.safeParse(raw)
    if (legacyParse.success) {
      const legacy = legacyParse.data
      const modernFormat: Partial<DemoOptions> = {
        examples: {
          exclude: legacy.excludeDemos,
          order: legacy.order,
          minimumVersion: legacy.minimumPolenVersion || legacy.minimumVersion,
          disabled: [],
        },
      }
      return mergeWithDefaults(modernFormat)
    }

    throw new Error(`Invalid config format`)
  } catch (e) {
    console.warn(`No config file found at ${configPath}.json, using defaults`)
    return DEFAULT_CONFIG
  }
}

// Pure functions to work with config

/**
 * Check if a Polen version meets the minimum requirement
 */
export function meetsMinimumPolenVersion(config: DemoConfig, polenVersion: string): boolean {
  const versionParsed = semverParse(polenVersion)
  const minVersionParsed = semverParse(config.examples.minimumVersion)

  if (!versionParsed || !minVersionParsed) {
    return false
  }

  return semverGte(versionParsed, minVersionParsed)
}

/**
 * Check if a demo is excluded
 */
export function isDemoExcluded(config: DemoConfig, demoName: string): boolean {
  return config.examples.exclude.includes(demoName)
}

/**
 * Get ordered list of demos (non-excluded)
 * @param config The demo configuration
 * @param availableDemos List of all available demo names
 * @returns Ordered list with configured order first, then alphabetical
 */
export function getOrderedDemos(config: DemoConfig, availableDemos: string[]): string[] {
  const nonExcluded = availableDemos.filter(demo => !isDemoExcluded(config, demo))
  const orderedDemos: string[] = []
  const remainingDemos = [...nonExcluded]

  // Add demos in the specified order
  for (const demo of config.examples.order) {
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
export function getDeploymentPath(config: DemoConfig, version: string, isStable = false): string {
  return isStable ? `/latest/` : `/${version}/`
}

/**
 * Get all disabled demos with metadata
 * @deprecated Use getDisabledExamples instead
 */
export function getDisabledDemos(
  config: DemoConfig,
): Record<string, { title: string; description: string; reason?: string }> {
  // For backward compatibility, return empty object
  return {}
}

/**
 * Get disabled examples from the new structure
 */
export function getDisabledExamples(config: DemoConfig): Array<{ example: string; reason: string }> {
  return config.examples.disabled
}

// Convenience getter functions
export const getExcludeDemos = (config: DemoConfig) => config.examples.exclude
export const getMinimumPolenVersion = (config: DemoConfig) => config.examples.minimumVersion
export const getOrder = (config: DemoConfig) => config.examples.order

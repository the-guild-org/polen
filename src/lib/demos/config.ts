import type { DemoOptions } from '#lib/demos/config-options'
import { DemoOptionsSchema } from '#lib/demos/config-options'
import { gte as semverGte, parse as semverParse } from '@vltpkg/semver'
import { defu } from 'defu'
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
export const mergeWithDefaults = (config: Partial<DemoOptions>): DemoConfig => {
  return defu(config, DEFAULT_CONFIG) as DemoConfig
}

/**
 * Load config from file (async)
 */
export const loadConfig = async (configPath = `.github/demo-config`): Promise<DemoConfig> => {
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
export const meetsMinimumPolenVersion = (config: DemoConfig, polenVersion: string): boolean => {
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
export const isDemoExcluded = (config: DemoConfig, demoName: string): boolean => {
  return config.examples.exclude.includes(demoName)
}

/**
 * Get ordered list of demos (non-excluded)
 * @param config The demo configuration
 * @param availableDemos List of all available demo names
 * @returns Ordered list with configured order first, then alphabetical
 */
export const getOrderedDemos = (config: DemoConfig, availableDemos: string[]): string[] => {
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
export const getDeploymentPath = (config: DemoConfig, version: string, isStable = false): string => {
  return isStable ? `/latest/` : `/${version}/`
}

/**
 * Get disabled examples from the new structure
 */
export const getDisabledExamples = (config: DemoConfig): Array<{ example: string; reason: string }> => {
  return config.examples.disabled
}

// Convenience getter functions
export const getExcludeDemos = (config: DemoConfig) => config.examples.exclude
export const getMinimumPolenVersion = (config: DemoConfig) => config.examples.minimumVersion
export const getOrder = (config: DemoConfig) => config.examples.order

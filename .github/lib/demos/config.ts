/**
 * Unified configuration system for demos
 */

import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseSemver, compare as compareSemver } from '@vltpkg/semver'

// Schema for demo configuration
const DemoConfigSchema = z.object({
  examples: z.object({
    exclude: z.array(z.string()).default([]),
    order: z.array(z.string()).default([]),
    minimumPolenVersion: z.string().default('0.1.0'),
  }),
  deployment: z.object({
    basePaths: z.record(z.string()).default({}),
    redirects: z.array(z.object({
      from: z.string(),
      to: z.string(),
    })).default([]),
    gc: z.object({
      retainStableVersions: z.boolean().default(true),
      retainCurrentCycle: z.boolean().default(true),
      retainDays: z.number().default(30),
    }).default({}),
  }).default({}),
  ui: z.object({
    theme: z.object({
      primaryColor: z.string().default('#000'),
      backgroundColor: z.string().default('#fff'),
      textColor: z.string().default('#000'),
      mutedTextColor: z.string().default('#666'),
    }).default({}),
    branding: z.object({
      title: z.string().default('Polen Demos'),
      description: z.string().default('Interactive GraphQL API documentation'),
      logoUrl: z.string().optional(),
    }).default({}),
  }).default({}),
  metadata: z.object({
    disabledDemos: z.record(z.object({
      title: z.string(),
      description: z.string(),
      reason: z.string().optional(),
    })).default({}),
  }).default({}),
})

export type DemoConfig = z.infer<typeof DemoConfigSchema>

// Default configuration
const DEFAULT_CONFIG: DemoConfig = {
  examples: {
    exclude: [],
    order: [],
    minimumPolenVersion: '0.1.0',
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
      primaryColor: '#000',
      backgroundColor: '#fff', 
      textColor: '#000',
      mutedTextColor: '#666',
    },
    branding: {
      title: 'Polen Demos',
      description: 'Interactive GraphQL API documentation',
    },
  },
  metadata: {
    disabledDemos: {
      github: {
        title: 'GitHub API',
        description: "Browse GitHub's extensive GraphQL API with over 1600 types.",
        reason: 'Currently disabled due to build performance.',
      },
    },
  },
}

/**
 * Configuration manager for demos system
 */
export class DemoConfigManager {
  private static instance: DemoConfigManager | null = null
  private config: DemoConfig | null = null

  static getInstance(): DemoConfigManager {
    if (!this.instance) {
      this.instance = new DemoConfigManager()
    }
    return this.instance
  }

  /**
   * Load configuration from file or use defaults
   */
  loadConfig(configPath?: string): DemoConfig {
    if (this.config) {
      return this.config
    }

    const defaultPath = join(process.cwd(), '.github/demo-config.json')
    const path = configPath || defaultPath

    try {
      const configFile = readFileSync(path, 'utf-8')
      const rawConfig = JSON.parse(configFile)
      this.config = DemoConfigSchema.parse({ ...DEFAULT_CONFIG, ...rawConfig })
    } catch (error) {
      // If config file doesn't exist or is invalid, use defaults
      this.config = DEFAULT_CONFIG
    }

    return this.config
  }

  /**
   * Get current configuration
   */
  getConfig(): DemoConfig {
    return this.config || this.loadConfig()
  }

  /**
   * Check if a version meets the minimum Polen requirement
   */
  meetsMinimumVersion(version: string): boolean {
    const config = this.getConfig()
    const minimum = config.examples.minimumPolenVersion
    
    try {
      // Parse both versions, handling 'v' prefix if present
      const versionParsed = parseSemver(version)
      const minimumParsed = parseSemver(minimum)
      
      if (!versionParsed || !minimumParsed) {
        // If parsing fails, fall back to string comparison
        console.warn(`Failed to parse version '${version}' or minimum '${minimum}'`)
        return version >= minimum
      }
      
      // Compare versions: returns -1 if version < minimum, 0 if equal, 1 if version > minimum
      const comparison = compareSemver(versionParsed, minimumParsed)
      return comparison >= 0
    } catch (error) {
      console.error(`Error comparing versions: ${error}`)
      // On error, be permissive and allow the version
      return true
    }
  }

  /**
   * Get ordered list of enabled examples
   */
  getOrderedExamples(availableExamples: string[]): string[] {
    const config = this.getConfig()
    const { exclude, order } = config.examples
    
    // Filter out excluded examples
    const enabled = availableExamples.filter(ex => !exclude.includes(ex))
    
    // Apply ordering
    const ordered = [...order.filter(ex => enabled.includes(ex))]
    const unordered = enabled.filter(ex => !order.includes(ex))
    
    return [...ordered, ...unordered.sort()]
  }

  /**
   * Get deployment path for a version
   */
  getDeploymentPath(version: string, isStable: boolean = false): string {
    return isStable ? '/latest/' : `/${version}/`
  }

  /**
   * Get all disabled demos with metadata
   */
  getDisabledDemos(): Record<string, { title: string; description: string; reason?: string }> {
    return this.getConfig().metadata.disabledDemos
  }
}

// Singleton instance for easy access
export const demoConfig = DemoConfigManager.getInstance()
/**
 * Utility functions for demo management
 */

import type { Version } from '#lib/version-history/index'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { getDemoConfig } from './config.ts'

/**
 * Get list of demo examples from the examples directory
 */
export async function getDemoExamples(): Promise<string[]> {
  const examplesDir = join(process.cwd(), 'examples')
  const examples: string[] = []

  // Read all directories in examples/
  try {
    const dirs = await fs.readdir(examplesDir, { withFileTypes: true })
    const dirNames = dirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    examples.push(...dirNames)
  } catch (e) {
    console.error(`Error reading examples directory:`, (e as Error).message)
  }

  // Use DemoConfig to filter and order examples
  const config = getDemoConfig()
  return config.getOrderedDemos(examples)
}

/**
 * Get deployment path for a version
 */
export const getDistTagPath = (version: Version): string => {
  return version.isPrerelease ? `/next/` : '/latest/'
}

export const getSemverPath = (version: Version): string => {
  return `/${version.semver}/`
}

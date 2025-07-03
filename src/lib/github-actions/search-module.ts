/**
 * Step discovery utilities for GitHub Actions
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface Options {
  /**
   * The name of the step to find
   */
  stepName: string
  /**
   * The name of the workflow (optional)
   */
  workflowName?: string
  /**
   * Base directory to search from (defaults to process.cwd())
   */
  baseDir?: string
}

export interface ModuleSearchResult {
  /**
   * Whether the step was found
   */
  found: boolean
  /**
   * The absolute path to the step module
   */
  path?: string
  /**
   * Paths that were searched
   */
  searchedPaths: string[]
}

/**
 * Find a workflow step collection using the convention:
 * .github/workflows/<workflow-name>.steps.ts
 */
export const searchModule = (options: Options): ModuleSearchResult => {
  const { workflowName, baseDir = process.cwd() } = options
  const searchedPaths: string[] = []

  if (!workflowName) {
    return {
      found: false,
      searchedPaths: [],
    }
  }

  const collectionPath = join(baseDir, `.github/workflows`, `${workflowName}.steps.ts`)
  searchedPaths.push(collectionPath)

  if (existsSync(collectionPath)) {
    return {
      found: true,
      path: collectionPath,
      searchedPaths,
    }
  }

  return {
    found: false,
    searchedPaths,
  }
}

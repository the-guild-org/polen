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
 * Discover a workflow step module using the convention:
 * 1. First try: .github/steps/<workflow-name>/<step-name>.ts
 * 2. Second try: .github/steps/<step-name>.ts
 */
export function searchModule(options: Options): ModuleSearchResult {
  const { stepName, workflowName, baseDir = process.cwd() } = options
  const searchedPaths: string[] = []

  if (workflowName) {
    const workflowSpecificPath = join(baseDir, '.github/steps', workflowName, `${stepName}.ts`)
    searchedPaths.push(workflowSpecificPath)

    if (existsSync(workflowSpecificPath)) {
      return {
        found: true,
        path: workflowSpecificPath,
        searchedPaths,
      }
    }
  }

  // Try general path
  const generalPath = join(baseDir, '.github/steps', `${stepName}.ts`)
  searchedPaths.push(generalPath)

  if (existsSync(generalPath)) {
    return {
      found: true,
      path: generalPath,
      searchedPaths,
    }
  }

  return {
    found: false,
    searchedPaths,
  }
}

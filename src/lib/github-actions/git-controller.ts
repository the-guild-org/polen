/**
 * Git controller for GitHub Actions
 * Provides simple git operations without exposing subprocess details
 */

import type { $ as ZxDollar } from 'zx'

export interface GitCommitOptions {
  /**
   * Commit message
   */
  message: string
  /**
   * Optional commit body for additional details
   */
  body?: string
  /**
   * Files or patterns to stage (defaults to '.')
   */
  add?: string | string[]
  /**
   * Working directory (defaults to current directory)
   */
  cwd?: string
  /**
   * Whether to push after committing (defaults to true)
   */
  push?: boolean
  /**
   * Whether to automatically configure the user to be GitHub (defaults to true)
   */
  autoConfigureUser?: boolean
}

export interface GitController {
  /**
   * Create a commit with the staged changes
   */
  commit(options: GitCommitOptions): Promise<boolean>

  /**
   * Check if there are any changes (staged or unstaged)
   */
  hasChanges(cwd?: string): Promise<boolean>

  /**
   * Configure git user for commits
   */
  configureUser(name?: string, email?: string): Promise<void>
}

/**
 * Create a git controller instance
 */
export function createGitController($: typeof ZxDollar): GitController {
  const api: GitController = {
    async commit(options) {
      const {
        message,
        body,
        add = `.`,
        cwd,
        push = true,
        autoConfigureUser = true,
      } = options

      const hasChanges = await api.hasChanges(`gh-pages`)
      if (!hasChanges) {
        console.log(`No changes to commit`)
        return false
      }

      if (autoConfigureUser) {
        await api.configureUser()
      }

      try {
        // Stage files
        const filesToAdd = Array.isArray(add) ? add : [add]
        for (const pattern of filesToAdd) {
          if (cwd) {
            await $`cd ${cwd} && git add ${pattern}`
          } else {
            await $`git add ${pattern}`
          }
        }

        // Check if there are changes to commit
        const statusCmd = cwd ? $`cd ${cwd} && git status --porcelain` : $`git status --porcelain`
        const status = await statusCmd

        if (!status.stdout.trim()) {
          return false // No changes to commit
        }

        // Build commit message
        let fullMessage = message
        if (body) {
          fullMessage = `${message}\n\n${body}`
        }

        // Commit
        if (cwd) {
          await $`cd ${cwd} && git commit -m ${fullMessage}`
        } else {
          await $`git commit -m ${fullMessage}`
        }

        // Push if requested
        if (push) {
          if (cwd) {
            await $`cd ${cwd} && git push`
          } else {
            await $`git push`
          }
        }

        return true
      } catch (error) {
        throw new Error(`Git commit failed: ${error}`)
      }
    },

    async hasChanges(cwd) {
      try {
        const cmd = cwd
          ? $`cd ${cwd} && git status --porcelain`
          : $`git status --porcelain`

        const result = await cmd
        return result.stdout.trim().length > 0
      } catch (error) {
        throw new Error(`Failed to check git status: ${error}`)
      }
    },

    async configureUser(name, email) {
      try {
        const userName = name || `github-actions[bot]`
        const userEmail = email || `github-actions[bot]@users.noreply.github.com`

        await $`git config user.name ${userName}`
        await $`git config user.email ${userEmail}`
      } catch (error) {
        throw new Error(`Failed to configure git user: ${error}`)
      }
    },
  }

  return api
}

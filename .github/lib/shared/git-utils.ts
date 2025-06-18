/**
 * Git utilities for GitHub Actions workflows
 */

import { $ } from 'zx'
import { safeExecute } from './error-handling.ts'

/**
 * Configure git for GitHub Actions bot
 */
export async function configureGit(): Promise<void> {
  return safeExecute('configure-git', async () => {
    await $`git config user.name "github-actions[bot]"`
    await $`git config user.email "github-actions[bot]@users.noreply.github.com"`
  })
}

/**
 * Check if there are changes to commit
 */
export async function hasChangesToCommit(): Promise<boolean> {
  return safeExecute('check-changes', async () => {
    const status = await $`git status --porcelain`.text()
    return status.trim().length > 0
  })
}

/**
 * Commit and push changes
 */
export async function commitAndPush(message: string): Promise<void> {
  return safeExecute('commit-and-push', async () => {
    await $`git commit -m ${message}`
    await $`git push`
  })
}

/**
 * Create a commit
 */
export function createCommitMessage(title: string, body?: string): string {
  return body ? `${title}\n\n${body}` : `${title}`
}

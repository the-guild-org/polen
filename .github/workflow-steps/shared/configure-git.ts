import { Step } from '../types.ts'

/**
 * Configure git for automated commits in GitHub Actions environment
 *
 * WHAT: Sets up git user identity for commits made by automation
 * WHY: GitHub requires user identity to be configured before making commits
 *
 * Uses the standard github-actions[bot] identity that GitHub provides
 * for automated commits. This ensures commits are properly attributed
 * and don't require personal user credentials.
 *
 * Used by workflows that need to commit changes back to repositories
 * (e.g., updating demos, garbage collection, deployment updates).
 */
export default Step(async ({ core, $ }) => {
  await $`git config user.name "github-actions[bot]"`
  await $`git config user.email "github-actions[bot]@users.noreply.github.com"`

  core.debug('Git configured for github-actions[bot]')
})

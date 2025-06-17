import { Step } from '../types.ts'

/**
 * Configure git for commits in GitHub Actions
 * Sets standard bot user configuration
 */
export default Step(async ({ core, $ }) => {
  await $`git config user.name "github-actions[bot]"`
  await $`git config user.email "github-actions[bot]@users.noreply.github.com"`

  core.debug('Git configured for github-actions[bot]')
})

import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

/**
 * Identify and remove old demo deployments
 *
 * Removal policy:
 * - Keep all stable versions forever
 * - Keep current development cycle (latest stable + newer prereleases)
 * - Remove prereleases from past development cycles
 *
 * Note: We don't check dist-tags because they should always point to
 * versions in the current cycle. If they don't, that's a bug that
 * should be surfaced. Git history provides recovery if needed.
 */
export default Step(async ({ core, $, fs }) => {
  core.startGroup('Garbage collect old demo deployments')

  const versionHistory = new VersionHistory()

  // Get prereleases from past development cycles
  const pastCyclePrereleases = await versionHistory.getPastDevelopmentCycles()
  const versionsToRemove = pastCyclePrereleases.map(v => v.tag)

  core.info(`Found ${versionsToRemove.length} old prereleases to remove`)
  if (versionsToRemove.length > 0) {
    core.debug(`Versions to remove: ${versionsToRemove.join(', ')}`)
  }

  // Find deployments to remove
  const toRemove = {
    trunk: [] as string[],
  }

  // Check trunk deployments (semver directories in root)
  const rootDirs = await fs.readdir('.')
  const semverDirs = rootDirs.filter((dir) => /^[0-9]+\.[0-9]+\.[0-9]+/.test(dir))

  // Check which directories exist and should be removed
  for (const dir of semverDirs) {
    if (versionsToRemove.includes(dir)) {
      toRemove.trunk.push(dir)
    }
  }

  core.debug(`Trunk deployments to remove: ${toRemove.trunk.join(', ')}`)

  // Remove deployments if any were found
  if (toRemove.trunk.length === 0) {
    core.info('No deployments to remove')
    core.setOutput('removed', 'false')

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '🟢 **No deployments needed removal**\n\n'
    summary += 'All deployments are still relevant and were kept.'
    await core.summary.addRaw(summary).write()
    core.endGroup()
    return
  }

  // Git should already be configured by the workflow

  // Remove trunk deployments
  for (const dir of toRemove.trunk) {
    try {
      const dirExists = await fs.stat(dir).then(() => true).catch(() => false)
      if (dirExists) {
        core.info(`Removing trunk deployment: ${dir}`)
        await $`git rm -rf ${dir}`
      }
    } catch (e) {
      core.error(`Failed to remove ${dir}: ${(e as Error).message}`)
    }
  }

  // Check if there are changes to commit
  const status = await $`git status --porcelain`.text()

  if (status.trim()) {
    // Commit the changes
    const commitMessage = `chore: garbage collect old trunk deployments

Removed: ${toRemove.trunk.join(', ')}`

    await $`git commit -m ${commitMessage}`
    await $`git push`

    core.info('✅ Successfully removed old deployments')
    core.setOutput('removed', 'true')
    core.setOutput('removedDirs', toRemove.trunk.join(', '))

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '✅ **Successfully removed old deployments**\n\n'
    summary += '## Removed Deployments\n'
    summary += toRemove.trunk.map(dir => `- ${dir}`).join('\n')
    await core.summary.addRaw(summary).write()
    core.endGroup()
  } else {
    core.info('No changes to commit')
    core.setOutput('removed', 'false')

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '🟢 **No deployments needed removal**\n\n'
    summary += 'All deployments are still relevant and were kept.'
    await core.summary.addRaw(summary).write()
    core.endGroup()
  }
})

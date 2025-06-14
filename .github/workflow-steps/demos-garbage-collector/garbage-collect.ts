import * as semver from 'semver'
import { Step } from '../types.ts'

/**
 * Identify and remove old demo deployments
 */
export default Step(async ({ core, $, fs }) => {
  // Get all tags to identify releases
  const tagsOutput = await $`git tag`.text()
  const tags = tagsOutput
    .split('\n')
    .filter(Boolean)
    .filter((tag): tag is string => semver.valid(tag) !== null) // Only keep valid semver tags

  // Separate stable releases from pre-releases
  const stableReleases = tags.filter((tag: string) => !tag.includes('-'))
  const preReleases = tags.filter((tag: string) => tag.includes('-'))

  // Find the latest stable release using proper semver comparison
  const latestStable = stableReleases.length > 0 ? stableReleases.sort(semver.compare).pop() : ''

  // Find what the dist-tags point to
  const distTagVersions = new Set<string>()

  for (const distTag of ['latest', 'next']) {
    try {
      const tagOutput = await $`git tag --points-at ${distTag}`.text()
      const versions = tagOutput
        .split('\n')
        .filter(Boolean)
        .filter((tag: string) => semver.valid(tag))

      versions.forEach((v: string) => distTagVersions.add(v))
    } catch (e) {
      console.log(`No "${distTag}" tag found`)
    }
  }

  // Find what the "next" tag points to (pre-release version)
  const nextVersion = Array.from(distTagVersions).find((v: string) => v.includes('-'))

  console.log('Latest stable release:', latestStable)
  console.log('Next version:', nextVersion)

  // Determine which pre-releases to keep
  let preReleasesToKeep: string[] = []

  if (nextVersion) {
    // Keep all pre-releases that belong to the same major.minor.patch as next
    const nextBase = semver.major(nextVersion)
      + '.'
      + semver.minor(nextVersion)
      + '.'
      + semver.patch(nextVersion)
    preReleasesToKeep = preReleases.filter((tag: string) => {
      const tagBase = semver.major(tag) + '.' + semver.minor(tag) + '.' + semver.patch(tag)
      return tagBase === nextBase
    })
  } else if (latestStable) {
    // Fallback: keep pre-releases newer than latest stable
    preReleasesToKeep = preReleases.filter((tag) => semver.gt(tag, latestStable))
  } else {
    // No stable release yet, keep all pre-releases
    preReleasesToKeep = preReleases
  }

  console.log('Stable releases (keep forever):', stableReleases)
  console.log('Pre-releases to keep (next range):', preReleasesToKeep)
  console.log('Dist-tag versions (keep forever):', Array.from(distTagVersions))

  // Find deployments to remove
  const toRemove = {
    trunk: [] as string[],
  }

  // Check trunk deployments (semver directories in root)
  const rootDirs = await fs.readdir('.')
  const semverDirs = rootDirs.filter((dir) => /^[0-9]+\.[0-9]+\.[0-9]+/.test(dir))

  // For semver deployments, we keep based on the tag policy
  for (const dir of semverDirs) {
    // Check if this version should be kept
    const isStableRelease = stableReleases.includes(dir)
    const isKeptPrerelease = preReleasesToKeep.includes(dir)
    const isDistTagVersion = distTagVersions.has(dir)

    if (!isStableRelease && !isKeptPrerelease && !isDistTagVersion) {
      toRemove.trunk.push(dir)
    }
  }

  console.log('Trunk deployments to remove:', toRemove.trunk)

  // Remove deployments if any were found
  if (toRemove.trunk.length === 0) {
    console.log('No deployments to remove')
    core.setOutput('removed', 'false')

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '🟢 **No deployments needed removal**\n\n'
    summary += 'All deployments are still relevant and were kept.'
    await core.summary.addRaw(summary).write()
    return
  }

  // Configure git
  await $`git config user.name "github-actions[bot]"`
  await $`git config user.email "github-actions[bot]@users.noreply.github.com"`

  // Remove trunk deployments
  for (const dir of toRemove.trunk) {
    try {
      const dirExists = await fs.stat(dir).then(() => true).catch(() => false)
      if (dirExists) {
        console.log(`Removing trunk deployment: ${dir}`)
        await $`git rm -rf ${dir}`
      }
    } catch (e) {
      console.error(`Failed to remove ${dir}:`, (e as Error).message)
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

    console.log('✅ Successfully removed old deployments')
    core.setOutput('removed', 'true')
    core.setOutput('removedDirs', toRemove.trunk.join(', '))

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '✅ **Successfully removed old deployments**\n\n'
    summary += '## Removed Deployments\n'
    summary += toRemove.trunk.map(dir => `- ${dir}`).join('\n')
    await core.summary.addRaw(summary).write()
  } else {
    console.log('No changes to commit')
    core.setOutput('removed', 'false')

    // Generate summary
    let summary = '# Garbage Collection Summary\n\n'
    summary += '🟢 **No deployments needed removal**\n\n'
    summary += 'All deployments are still relevant and were kept.'
    await core.summary.addRaw(summary).write()
  }
})

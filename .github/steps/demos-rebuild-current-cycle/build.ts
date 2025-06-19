import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { buildDemosHome, demoBuilder, getDemoConfig } from '../../../src/lib/demos/index.ts'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'
import { tryCatchMany } from '../../../src/lib/kit-temp.ts'

const Outputs = z.object({
  did: z.boolean(),
})

/**
 * Build demos for current development cycle
 */
export default GitHubActions.createStep({
  description: 'Build demos for all versions in the current development cycle',
  outputs: Outputs,
  async run({ core, fs, context }) {
    const versionHistory = new VersionHistory()
    const config = getDemoConfig()

    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning('No stable version found - skipping update')
      return {
        did: false,
      }
    }

    // Check if latest dist-tag exists and matches the stable version
    const latestTag = await versionHistory.getDistTagLatest()
    if (!latestTag || latestTag.semverTag !== cycle.stable.tag) {
      core.warning(
        `Latest dist-tag ${
          latestTag ? `points to ${latestTag.semverTag}` : 'not found'
        }, but latest stable is ${cycle.stable.tag}`,
      )
    }

    const versions = cycle.all.map(v => v.tag)
    const versionList = versions.join(', ')

    core.info(`✅ Found ${cycle.all.length} versions to rebuild: ${versionList}`)
    core.info(`  Latest stable: ${cycle.stable.tag}`)
    if (cycle.prereleases.length > 0) {
      core.info(`  Prereleases: ${cycle.prereleases.map(v => v.tag).join(', ')}`)
    }

    if (versions.length === 0) {
      throw new Error('No versions to rebuild')
    }

    core.info(`Building demos for ${versions.length} versions: ${versions.join(', ')}`)

    // Build each version
    const [successes, errors] = await tryCatchMany(versions, async (version) => {
      const isStable = VersionHistory.isStableVersion(version)
      const deploymentPath = config.getDeploymentPath(version, isStable)
      const basePath = `/${context.repo.repo}${deploymentPath}`
      await demoBuilder.build(version, { basePath })
      return version
    })

    const failedVersions = errors.map(e => e.context.item)

    if (errors.length > 0) {
      core.error(`Failed to build ${failedVersions.length} versions: ${failedVersions.join(', ')}`)
    }

    if (errors.length === versions.length) {
      throw new Error('All version builds failed')
    }

    core.info(`✅ Successfully built ${successes.length}/${versions.length} versions`)

    // Update demos home page with all deployment data
    core.info('Updating demos home page...')

    // Get version info for trunk page
    const allVersions = await versionHistory.getVersions()
    const latestStable = await versionHistory.getLatestStableVersion()
    const distTagInfos = await versionHistory.getDistTags()

    // Format trunk deployment data
    const trunkDeployments = {
      latest: latestStable
        ? {
          sha: latestStable.commit,
          shortSha: latestStable.commit.substring(0, 7),
          tag: latestStable.tag,
        }
        : null,
      previous: allVersions
        .filter(v => v.tag !== latestStable?.tag)
        .slice(0, 10)
        .map(v => ({
          sha: v.commit,
          shortSha: v.commit.substring(0, 7),
          tag: v.tag,
        })),
    }

    const distTags: Record<string, string> = {}
    for (const info of distTagInfos) {
      if (info.semverTag) {
        distTags[info.name] = info.semverTag
      }
    }

    await buildDemosHome({
      mode: 'demo',
      basePath: `/${context.repo.repo}/`,
      trunkDeployments,
      distTags,
      outputDir: 'dist-demos',
    })
    // Copy to gh-pages root
    await fs.copyFile('dist-demos/index.html', 'gh-pages/index.html')
    core.info('✅ Successfully updated demos home page')

    return {
      did: true,
    }
  },
})

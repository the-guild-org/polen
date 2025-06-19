import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { buildDemosHome, demoBuilder, getDemoConfig } from '../../../src/lib/demos/index.ts'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'
import { tryCatchMany } from '../../../src/lib/kit-temp.ts'

const Outputs = z.object({
  did: z.boolean(),
})

export default GitHubActions.createStep({
  description: 'Build all demos for all versions in the current development cycle',
  outputs: Outputs,
  async run({ core, context }) {
    const versionHistory = new VersionHistory()
    const config = getDemoConfig()

    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning('No stable version found - skipping update')
      return {
        did: false,
      }
    }

    const versions = cycle.all.map(v => v.git.tag)

    core.info(`✅ Found ${cycle.all.length} versions to rebuild: ${versions.join(', ')}`)
    core.info(`  Latest stable: ${cycle.stable.git.tag}`)
    if (cycle.prereleases.length > 0) {
      core.info(`  Prereleases: ${cycle.prereleases.map(v => v.git.tag).join(', ')}`)
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

    if (errors.length > 0) {
      core.error(`Failed to build ${errors.length} versions: ${errors.map(e => e.context.item).join(', ')}`)
    }

    if (errors.length === versions.length) {
      throw new Error('All version builds failed')
    }

    core.info(`✅ Successfully built ${successes.length}/${versions.length} versions`)

    // Get version info for trunk page
    const allVersions = await versionHistory.getVersions()
    const latestStable = await versionHistory.getLatestStableVersion()
    const distTagInfos = await versionHistory.getDistTags()

    // Format trunk deployment data
    const trunkDeployments = {
      latest: latestStable
        ? {
          sha: latestStable.git.sha,
          shortSha: latestStable.git.sha.substring(0, 7),
          tag: latestStable.git.tag,
        }
        : null,
      previous: allVersions
        .filter(v => v.git.tag !== latestStable?.git.tag)
        .slice(0, 10)
        .map(v => ({
          sha: v.git.sha,
          shortSha: v.git.sha.substring(0, 7),
          tag: v.git.tag,
        })),
    }

    const distTags: Record<string, string> = {}
    for (const info of distTagInfos) {
      if (info.semverTag) {
        distTags[info.name] = info.semverTag
      }
    }

    await buildDemosHome({
      basePath: `/${context.repo.repo}/`,
      trunkDeployments,
      distTags,
      outputPath: 'gh-pages/index.html',
    })

    return {
      did: true,
    }
  },
})

import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { buildDemosHomeWithCatalog, demoBuilder, getDemoConfig } from '../../../src/lib/demos/index.ts'
import { GitHubActions } from '../../../src/lib/github-actions/index.ts'
import { tryCatchMany } from '../../../src/lib/kit-temp.ts'

const Outputs = z.object({
  did: z.boolean(),
})

export default GitHubActions.createStep({
  description: 'Build all demos for all versions in the current development cycle',
  outputs: Outputs,
  async run({ core, context }) {
    const config = getDemoConfig()

    const cycle = await VersionHistory.getCurrentDevelopmentCycle()

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

    // Get version catalog for trunk page
    const catalog = await VersionHistory.getVersionCatalog()

    await buildDemosHomeWithCatalog({
      basePath: `/${context.repo.repo}/`,
      catalog,
      outputPath: 'gh-pages/index.html',
    })

    return {
      did: true,
    }
  },
})

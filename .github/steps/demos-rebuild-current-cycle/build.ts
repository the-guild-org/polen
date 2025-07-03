import { buildDemosHomeWithCatalog, buildMultipleVersions } from '#lib/demos/index'
import { GitHubActions } from '#lib/github-actions/index'
import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'
import { $ } from 'zx'

const Outputs = z.object({
  did: z.boolean(),
})

export default GitHubActions.createStep({
  description: `Build all demos for all versions in the current development cycle`,
  outputs: Outputs,
  async run({ core, context }) {
    // const config = getDemoConfig()

    const cycle = await VersionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning(`No stable version found - skipping update`)
      return {
        did: false,
      }
    }

    const versions = cycle.all.map(v => v.git.tag)

    // Use buildMultipleVersions to build and deploy all versions
    const results = await buildMultipleVersions(versions, `gh-pages`)

    if (results.built.length === 0) {
      throw new Error(`No versions were successfully built`)
    }

    // Create 'latest' symlink for the stable version
    if (cycle.stable && results.built.includes(cycle.stable.git.tag)) {
      // const stableDir = `gh-pages/${cycle.stable.git.tag}`
      const latestDir = `gh-pages/latest`

      // Remove existing latest directory/symlink if it exists
      await core.group(`Creating latest symlink`, async () => {
        try {
          await $`rm -rf ${latestDir}`
          await $`ln -s ${cycle.stable!.git.tag} ${latestDir}`
          core.info(`Created symlink: latest -> ${cycle.stable!.git.tag}`)
        } catch (error) {
          core.warning(`Failed to create latest symlink: ${error}`)
        }
      })
    }

    // Get version catalog for trunk page
    const catalog = await VersionHistory.getVersionCatalog()

    await buildDemosHomeWithCatalog({
      basePath: `/${context.repo.repo}/`,
      catalog,
      outputPath: `gh-pages/index.html`,
    })

    return {
      did: true,
    }
  },
})

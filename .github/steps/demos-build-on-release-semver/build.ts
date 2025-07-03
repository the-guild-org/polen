import { build, buildDemosHome, getDeploymentPath, loadConfig, meetsMinimumPolenVersion } from '#lib/demos/index'
import { GitHubActions } from '#lib/github-actions/index'
import { VersionHistory } from '#lib/version-history/index'
import { z } from 'zod/v4'

const Inputs = z.object({
  previous: z.object({
    tag: z.string(),
    is_prerelease: z.boolean(),
    action: z.string(),
  }),
})

const Outputs = z.object({
  build_complete: z.boolean(),
})

export default GitHubActions.createStep({
  inputs: Inputs,
  outputs: Outputs,
  async run({ inputs, context }) {
    const { tag: semver } = inputs.previous
    const config = await loadConfig()

    // Check minimum version requirement
    if (!meetsMinimumPolenVersion(config, semver)) {
      const minVersion = config.examples.minimumVersion
      throw new Error(`Version ${semver} is below minimum ${minVersion}`)
    }

    // Determine deployment path
    const isStable = VersionHistory.isStableVersion(semver)
    const deploymentPath = getDeploymentPath(config, semver, isStable)
    const basePath = `/${context.repo.repo}${deploymentPath}`

    // Build landing page
    await buildDemosHome({
      basePath,
    })

    // Build individual demos
    await build(semver, { basePath })

    return {
      build_complete: true,
    }
  },
})

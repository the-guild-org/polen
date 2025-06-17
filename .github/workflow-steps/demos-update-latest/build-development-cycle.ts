import { demoBuilder } from '../../../src/lib/demos/builder.js'
import { VersionHistory } from '../../../src/lib/version-history/index.js'
import { Step } from '../types.ts'

interface Inputs {
  versions_to_rebuild: string[]
}

/**
 * Build demos for all versions in the current development cycle
 * 
 * WHAT: Builds demo sites for current stable + prereleases using latest example code
 * WHY: Updates demos when example projects or Polen library changes, without rebuilding old versions
 * 
 * This is a build-only step that:
 * - Uses current main branch examples (latest features)
 * - Builds each version with appropriate base paths
 * - Does NOT deploy (separate step handles deployment)
 * 
 * Each version gets built with correct paths:
 * - Stable versions: Built for /latest/ deployment
 * - Prereleases: Built for /{version}/ deployment
 * 
 * Used by demos-update-latest workflow when examples or library changes.
 */
export default Step<Inputs>(async ({ core, inputs }) => {
  try {
    const versions = inputs.versions_to_rebuild || []

    if (versions.length === 0) {
      core.setFailed('No versions to rebuild')
      return
    }

    core.info(`Building demos for ${versions.length} versions: ${versions.join(', ')}`)

    // Build demos for each version without git checkout
    // (assumes we're on main branch with current examples)
    for (const version of versions) {
      const basePath = VersionHistory.getDeploymentPath(version)
      await demoBuilder.build(version, { basePath })
    }

    core.setOutput('build_complete', 'true')
    core.info(`✅ Successfully built demos for development cycle`)
  } catch (error) {
    core.setFailed(`Failed to build development cycle: ${error}`)
  }
})

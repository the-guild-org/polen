import { z } from 'zod/v4'
import { CommonSchemas, defineStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const Inputs = z.object({
  previous: z.object({
    versions_to_rebuild: CommonSchemas.jsonString(z.array(z.string())),
  }),
})

const Outputs = z.object({
  build_complete: z.string(),
  failed_versions: z.string(),
})

/**
 * Build demos for current development cycle
 */
export default defineStep({
  name: 'build-current-cycle',
  description: 'Build demos for all versions in the current development cycle',
  inputs: Inputs,
  outputs: Outputs,
  async run({ core, inputs }) {
    const versions = inputs.previous.versions_to_rebuild

    if (versions.length === 0) {
      throw new Error('No versions to rebuild')
    }

    core.info(`Building demos for ${versions.length} versions: ${versions.join(', ')}`)

    const result = await demoOrchestrator.buildCurrentCycle()

    if (result.failedVersions.length > 0) {
      core.error(`Failed to build ${result.failedVersions.length} versions: ${result.failedVersions.join(', ')}`)
    }

    if (!result.success) {
      throw new Error('All version builds failed')
    }

    return {
      build_complete: 'true',
      failed_versions: JSON.stringify(result.failedVersions),
    }
  },
})

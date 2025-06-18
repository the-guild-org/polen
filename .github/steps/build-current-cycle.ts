import { z } from 'zod/v4'
import { CommonSchemas, defineWorkflowStep } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'

const BuildCurrentCycleInputs = z.object({
  versions_to_rebuild: CommonSchemas.jsonString(z.array(z.string())),
})

const BuildCurrentCycleOutputs = z.object({
  build_complete: z.string(),
  failed_versions: z.string(),
})

/**
 * Build demos for current development cycle
 */
export default defineWorkflowStep({
  name: 'build-current-cycle',
  description: 'Build demos for all versions in the current development cycle',
  inputs: BuildCurrentCycleInputs,
  outputs: BuildCurrentCycleOutputs,

  async execute({ core, inputs }) {
    const versions = inputs.versions_to_rebuild

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

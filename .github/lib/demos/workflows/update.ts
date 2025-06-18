/**
 * Unified workflow steps for demo updates
 */

import { z } from 'zod'
import { defineWorkflowStep, CommonSchemas } from '../../../../src/lib/github-actions/index.js'
import { demoOrchestrator } from '../orchestrator.ts'
import { VersionHistory } from '../../../../src/lib/version-history/index.js'

// Input/Output schemas
const CheckLatestTagOutputs = z.object({
  has_versions: z.string(),
  versions_to_rebuild: z.string(),
})

const BuildCurrentCycleInputs = z.object({
  versions_to_rebuild: CommonSchemas.jsonString(z.array(z.string())),
})

const BuildCurrentCycleOutputs = z.object({
  build_complete: z.string(),
  failed_versions: z.string(),
})

const GarbageCollectOutputs = z.object({
  removed: z.string(),
  removed_count: z.string(),
})

/**
 * Check current development cycle and prepare versions for rebuilding
 */
export const checkLatestTag = defineWorkflowStep({
  name: 'check-latest-tag',
  description: 'Identify all versions in the current development cycle that need demo updates',
  inputs: z.object({}),
  outputs: CheckLatestTagOutputs,
  
  async execute({ core }) {
    const versionHistory = new VersionHistory()

    // Get the current development cycle
    const cycle = await versionHistory.getCurrentDevelopmentCycle()

    if (!cycle.stable) {
      core.warning('No stable version found - skipping update')
      return {
        has_versions: 'false',
        versions_to_rebuild: '[]',
      }
    }

    // Check if latest dist-tag exists and matches the stable version
    const latestTag = await versionHistory.getDistTag('latest')
    if (!latestTag || latestTag.semverTag !== cycle.stable.tag) {
      core.warning(
        `Latest dist-tag ${
          latestTag ? `points to ${latestTag.semverTag}` : 'not found'
        }, but latest stable is ${cycle.stable.tag}`
      )
    }

    const versions = cycle.all.map(v => v.tag)
    const versionList = versions.join(', ')
    
    core.info(`✅ Found ${cycle.all.length} versions to rebuild: ${versionList}`)
    core.info(`  Latest stable: ${cycle.stable.tag}`)
    if (cycle.prereleases.length > 0) {
      core.info(`  Prereleases: ${cycle.prereleases.map(v => v.tag).join(', ')}`)
    }

    return {
      has_versions: 'true',
      versions_to_rebuild: JSON.stringify(versions),
    }
  },
})

/**
 * Build demos for current development cycle
 */
export const buildCurrentCycle = defineWorkflowStep({
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

/**
 * Garbage collect old demo deployments
 */
export const garbageCollect = defineWorkflowStep({
  name: 'garbage-collect',
  description: 'Remove old demo deployments to save space',
  inputs: z.object({}),
  outputs: GarbageCollectOutputs,
  
  async execute({ core }) {
    const result = await demoOrchestrator.garbageCollect()

    if (result.removed.length > 0) {
      core.info(`✅ Removed ${result.removed.length} old deployments: ${result.removed.join(', ')}`)
    } else {
      core.info('✅ No old deployments to remove')
    }

    if (result.errors.length > 0) {
      core.error(`Errors during cleanup: ${result.errors.join(', ')}`)
    }

    return {
      removed: JSON.stringify(result.removed),
      removed_count: String(result.removed.length),
    }
  },
})
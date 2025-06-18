import { z } from 'zod/v4'
import { defineStep, ReleaseContext, WorkflowDispatchContext } from '../../src/lib/github-actions/index.ts'
import { demoOrchestrator } from '../lib/demos/orchestrator.ts'
import { DeploymentPathManager } from '../lib/demos/path-manager.ts'

const Inputs = z.object({
  previous: z.object({
    tag: z.string(),
    actual_tag: z.string(),
    is_prerelease: z.string(),
  }),
})

const Outputs = z.object({
  deployment_ready: z.string(),
})

// This step can handle both release and workflow_dispatch events
const ReleaseDeploymentContext = z.union([
  ReleaseContext,
  WorkflowDispatchContext,
])

/**
 * Prepare release deployment by organizing built demos into deployment structure
 */
export default defineStep({
  name: 'prepare-release-deployment',
  description: 'Prepare release deployment by organizing built demos into deployment structure',
  inputs: Inputs,
  outputs: Outputs,
  context: ReleaseDeploymentContext,
  async run({ core, inputs, fs }) {
    const { actual_tag, is_prerelease } = inputs.previous

    core.info(`Preparing deployment for release ${actual_tag}`)

    // Create deployment directory structure
    const deployDir = 'gh-pages-deploy'
    await fs.mkdir(deployDir, { recursive: true })

    // Copy built demos from example directories to deployment structure
    const pathManager = new DeploymentPathManager()
    const examples = ['pokemon', 'hive'] // TODO: Get from config

    for (const example of examples) {
      const sourceDir = `examples/${example}/dist`
      const targetDir = `${deployDir}/${example}`

      try {
        await fs.cp(sourceDir, targetDir, { recursive: true })
        core.info(`✅ Copied ${example} demo`)
      } catch (error) {
        core.warning(`Failed to copy ${example}: ${error}`)
      }
    }

    // Copy landing page if it exists
    const landingSource = 'dist-demos/index.html'
    const landingTarget = `${deployDir}/index.html`
    try {
      await fs.copyFile(landingSource, landingTarget)
      core.info(`✅ Copied landing page`)
    } catch (error) {
      core.warning(`No landing page found: ${error}`)
    }

    core.info('✅ Release deployment prepared successfully')

    return {
      deployment_ready: 'true',
    }
  },
})

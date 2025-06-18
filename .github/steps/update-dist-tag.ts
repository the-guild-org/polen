import { z } from 'zod/v4'
import { defineStep, ReleaseContext, WorkflowDispatchContext } from '../../src/lib/github-actions/index.ts'

const Inputs = z.object({
  previous: z.object({
    tag: z.string(),
    actual_tag: z.string(),
  }),
})

const Outputs = z.object({
  updated: z.string(),
})

// This step can handle both release and workflow_dispatch events
const UpdateDistTagContext = z.union([
  ReleaseContext,
  WorkflowDispatchContext,
])

/**
 * Update dist tag deployment on GitHub Pages
 */
export default defineStep({
  name: 'update-dist-tag',
  description: 'Update dist tag (like "latest") to point to the actual semver release',
  inputs: Inputs,
  outputs: Outputs,
  context: UpdateDistTagContext,
  async run({ core, github, context, inputs }) {
    const { tag, actual_tag } = inputs.previous

    core.info(`Updating dist tag ${tag} to point to ${actual_tag}`)

    // Since GitHub Pages doesn't support symlinks, we need to trigger
    // a separate deployment that copies the content
    try {
      // Trigger workflow to copy content
      await github.rest.actions.createWorkflowDispatch({
        owner: context.repo.owner,
        repo: context.repo.repo,
        workflow_id: 'copy-dist-tag.yaml',
        ref: 'main',
        inputs: {
          dist_tag: tag,
          semver_tag: actual_tag,
        },
      })

      core.info(`✅ Triggered dist tag update workflow`)
      return { updated: 'true' }
    } catch (error) {
      core.warning(`Failed to trigger dist tag update: ${error}`)
      return { updated: 'false' }
    }
  },
})

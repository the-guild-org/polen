import { z } from 'zod/v4'
import { defineStep } from '../../src/lib/github-actions/index.ts'

/**
 * Debug step to log workflow reference information
 */
export default defineStep({
  name: 'debug-workflow-ref',
  description: 'Debug workflow reference to understand what values are available',
  inputs: z.object({}),
  async run({ core, context }) {
    core.info('=== Workflow Reference Debug ===')
    core.info(`github.workflow: ${context.workflow}`)
    core.info(`github.workflow_ref: ${(context as any).workflow_ref || 'undefined'}`)
    core.info(`github.workflow_sha: ${(context as any).workflow_sha || 'undefined'}`)
    core.info(`github.job: ${context.job}`)
    
    // Log environment variables that might be relevant
    core.info('=== Environment Variables ===')
    core.info(`GITHUB_WORKFLOW: ${process.env['GITHUB_WORKFLOW'] || 'undefined'}`)
    core.info(`GITHUB_WORKFLOW_REF: ${process.env['GITHUB_WORKFLOW_REF'] || 'undefined'}`)
    core.info(`GITHUB_WORKFLOW_SHA: ${process.env['GITHUB_WORKFLOW_SHA'] || 'undefined'}`)
    
    // Parse workflow_ref if available
    const workflowRef = (context as any).workflow_ref
    if (workflowRef) {
      core.info('=== Parsing workflow_ref ===')
      // Expected format: owner/repo/.github/workflows/workflow-name.yaml@ref
      const match = workflowRef.match(/^(.+?)\/(.+?)\/.github\/workflows\/(.+?)@(.+)$/)
      if (match) {
        const [, owner, repo, workflowFile, ref] = match
        core.info(`Owner: ${owner}`)
        core.info(`Repo: ${repo}`)
        core.info(`Workflow file: ${workflowFile}`)
        core.info(`Ref: ${ref}`)
        
        // Extract workflow name from file
        const workflowName = workflowFile.replace(/\.(yml|yaml)$/, '')
        core.info(`Workflow name: ${workflowName}`)
      } else {
        core.info('workflow_ref does not match expected format')
        core.info(`Actual value: ${workflowRef}`)
      }
    }
  },
})
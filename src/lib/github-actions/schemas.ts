/**
 * Predefined Zod schemas for common GitHub Actions contexts
 */

import { z } from 'zod/v4'

/**
 * GitHub context schema based on @actions/github context
 * This can be used in workflow steps to type the github context
 */
export const GitHubContextSchema = z.object({
  action: z.string().optional(),
  action_path: z.string().optional(),
  action_ref: z.string().optional(),
  action_repository: z.string().optional(),
  action_status: z.string().optional(),
  actor: z.string(),
  actor_id: z.string(),
  api_url: z.string(),
  base_ref: z.string(),
  env: z.string().optional(),
  event: z.record(z.string(), z.unknown()),
  event_name: z.string(),
  event_path: z.string().optional(),
  graphql_url: z.string(),
  head_ref: z.string(),
  job: z.string(),
  path: z.string().optional(),
  ref: z.string(),
  ref_name: z.string(),
  ref_protected: z.boolean(),
  ref_type: z.string(),
  repository: z.string(),
  repository_id: z.string().optional(),
  repository_owner: z.string(),
  repository_owner_id: z.string(),
  repositoryUrl: z.string().optional(),
  retention_days: z.string().optional(),
  run_id: z.string(),
  run_number: z.string(),
  run_attempt: z.string(),
  secret_source: z.string().optional(),
  server_url: z.string(),
  sha: z.string(),
  token: z.string().optional(),
  triggering_actor: z.string().optional(),
  workflow: z.string(),
  workflow_ref: z.string().optional(),
  workflow_sha: z.string().optional(),
  workspace: z.string().optional(),
})

/**
 * Common schema for step outputs
 * Steps can extend this or use their own schema
 */
export const StepOutputsSchema = z.record(z.string(), z.string())

/**
 * Combined schema for all well-known inputs
 */
export const WellKnownInputsSchema = z.object({
  context: GitHubContextSchema.optional(),
  previous: StepOutputsSchema.optional(),
})

/**
 * Helper to create step input schemas with well-known inputs
 */
export function createStepInputSchema<T extends z.ZodRawShape>(
  stepInputs: T,
  options?: {
    requireContext?: boolean
    requirePrevious?: boolean
  },
) {
  const baseShape: z.ZodRawShape = {
    ...stepInputs,
    context: options?.requireContext ? GitHubContextSchema : GitHubContextSchema.optional(),
    previous: options?.requirePrevious ? StepOutputsSchema : StepOutputsSchema.optional(),
  }

  return z.object(baseShape)
}

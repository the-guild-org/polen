/**
 * Type-safe workflow step framework for GitHub Actions
 */

// import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { z } from 'zod/v4'
import type { PRController } from './pr-controller.ts'
import type { Context, ContextSchema as RealContextSchema } from './schemas/context.ts'

/**
 * Arguments passed to the step's run function.
 *
 * @template $Inputs - The validated input values based on your inputs schema
 * @template $Context - The GitHub Actions context (validated if context schema provided)
 */
export interface Args<$Inputs extends Inputs = Inputs, $Context = Context> {
  /** GitHub Actions core utilities for logging, setting outputs, etc. */
  core: typeof import('@actions/core')

  /** GitHub Actions context containing event payload, repo info, etc. */
  context: $Context

  /** Validated input values passed to the step */
  inputs: $Inputs

  /** Authenticated Octokit instance for GitHub API operations */
  github: InstanceType<typeof GitHub>

  /** zx's $ function for executing shell commands */
  $: typeof import('zx').$

  /** Node.js fs/promises module for file operations */
  fs: typeof import('node:fs/promises')

  /** PR controller for pull request operations (comment, review, etc.) */
  pr: PRController
}

export type Outputs = object

export type Inputs = object

type InputsSchema = z.ZodObject

type OutputsSchema = z.ZodObject

// This is a loose type because working with sub/sup schema types is complex, maybe not even workable, unclear, and not worth the effort
type ContextSchema = z.Schema

// Export the full step definition for runner
export interface Step<
  $InputsSchema extends InputsSchema = InputsSchema,
  $OutputsSchema extends OutputsSchema = OutputsSchema,
  $ContextSchema extends ContextSchema = ContextSchema,
> {
  definition: Definition<
    $InputsSchema,
    $OutputsSchema,
    $ContextSchema
  >
  run: Runner<
    z.output<$InputsSchema>,
    z.output<$OutputsSchema>,
    z.output<$ContextSchema>
  >
}

export type Runner<
  $Inputs extends Inputs = Inputs,
  $Outputs extends Outputs = Outputs,
  $Context = Context,
> = (
  context: Args<$Inputs, $Context>,
) => Promise<$Outputs>

// Generic workflow step definition
export interface Definition<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends ContextSchema,
> {
  name: string
  description: string
  inputsSchema?: $InputsSchema
  outputsSchema?: $OutputsSchema
  contextSchema?: $ContextSchema
}

// Generic workflow step definition
export interface CreateInput<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends z.Schema,
> {
  name: string
  description: string
  inputs?: $InputsSchema
  outputs?: $OutputsSchema
  context?: $ContextSchema
  run: (
    args: Args<z.output<$InputsSchema>, z.output<$ContextSchema>>,
    // todo: Obj.isEmpty ...
  ) => Promise<{} extends z.Infer<$OutputsSchema> ? void : z.Infer<$OutputsSchema>>
}

/**
 * Create a type-safe GitHub Actions workflow step with runtime validation.
 *
 * This is the main entry point for defining custom workflow steps that can be executed
 * by the GitHub Actions runner. It provides:
 * - Type-safe inputs/outputs with Zod schema validation
 * - Automatic GitHub Actions output handling (both individual outputs and bundled JSON)
 * - Context validation to ensure steps run in the correct workflow events
 * - Integration with GitHub API via Octokit
 * - Built-in error handling and logging
 *
 * @example Basic step with inputs and outputs
 * ```typescript
 * import { z } from 'zod'
 * import { GitHubActions } from '#lib/github-actions'
 *
 * export default GitHubActions.createStep({
 *   name: 'my-step',
 *   description: 'Processes some data and returns results',
 *   inputs: z.object({
 *     message: z.string(),
 *     count: z.number().optional().default(1),
 *   }),
 *   outputs: z.object({
 *     result: z.string(),
 *     processed: z.boolean(),
 *   }),
 *   async run({ inputs, core }) {
 *     core.info(`Processing: ${inputs.message}`)
 *
 *     return {
 *       result: inputs.message.toUpperCase(),
 *       processed: true,
 *     }
 *   }
 * })
 * ```
 *
 * @example Step with specific context requirements
 * ```typescript
 * export default GitHubActions.createStep({
 *   name: 'pr-only-step',
 *   description: 'This step only runs on pull requests',
 *   context: GitHubActions.PullRequestContext,
 *   outputs: z.object({
 *     pr_number: z.number(),
 *   }),
 *   async run({ context, core }) {
 *     const prNumber = context.payload.pull_request.number
 *     core.info(`Running on PR #${prNumber}`)
 *
 *     return { pr_number: prNumber }
 *   }
 * })
 * ```
 *
 * @example Using the GitHub API
 * ```typescript
 * export default GitHubActions.createStep({
 *   name: 'create-issue',
 *   description: 'Creates a GitHub issue',
 *   inputs: z.object({
 *     title: z.string(),
 *     body: z.string(),
 *   }),
 *   outputs: z.object({
 *     issue_number: z.number(),
 *     issue_url: z.string(),
 *   }),
 *   async run({ inputs, github, context }) {
 *     const issue = await github.rest.issues.create({
 *       owner: context.repo.owner,
 *       repo: context.repo.repo,
 *       title: inputs.title,
 *       body: inputs.body,
 *     })
 *
 *     return {
 *       issue_number: issue.data.number,
 *       issue_url: issue.data.html_url,
 *     }
 *   }
 * })
 * ```
 *
 * @param input - Step configuration object
 * @param input.name - Unique identifier for the step (used in logging and debugging)
 * @param input.description - Human-readable description of what the step does
 * @param input.inputs - Optional Zod schema for validating step inputs
 * @param input.outputs - Optional Zod schema for validating step outputs
 * @param input.context - Optional Zod schema for validating GitHub Actions context (event type)
 * @param input.run - Async function that implements the step logic
 *
 * @returns A Step object that can be executed by the GitHub Actions runner
 *
 * @remarks
 * - All outputs are automatically set as GitHub Actions outputs
 * - Boolean outputs are properly handled (use fromJSON in workflows)
 * - A special 'json' output contains all outputs bundled together
 * - The runner provides extensive logging and error handling
 * - Steps can access PR controller for pull request operations
 * - The `$` from zx is available for shell commands
 */
export function createStep<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends ContextSchema = RealContextSchema,
>(
  input: CreateInput<$InputsSchema, $OutputsSchema, $ContextSchema>,
): Step<$InputsSchema, $OutputsSchema, $ContextSchema> {
  const { run, inputs, outputs, context, ...rest } = input
  const definition: Definition<$InputsSchema, $OutputsSchema, $ContextSchema> = {
    ...rest,
    inputsSchema: inputs,
    outputsSchema: outputs,
    contextSchema: context,
  }
  return {
    definition,
    run,
  }
}

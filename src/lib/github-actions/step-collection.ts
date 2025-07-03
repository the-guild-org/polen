import { Str } from '@wollybeard/kit'
import type { z } from 'zod/v4'
import type { Context } from './runner-args-context.ts'
import type { RunnerArgs } from './runner-args.ts'
import { normalizeStepInput, type StepInput } from './step.ts'
import type { Inputs, Outputs, Step } from './step.ts'

/**
 * Step collection data structure
 */
export interface StepCollection<context = Context> {
  config?: StepCollectionConfig
  steps: Record<string, StepInput<any, any, context>>
}

type CreateStepsCollection = <
  contextSchema extends z.Schema = z.Schema<Context>,
  steps extends Record<string, StepInput<any, any, z.output<contextSchema>>> = Record<
    string,
    StepInput<any, any, z.output<contextSchema>>
  >,
>(
  input: StepCollectionConfig<contextSchema> & {
    /**
     * Steps to include in the collection. Each step can be either:
     * - A runner function (async function that processes inputs and returns outputs)
     * - A step configuration object with optional inputs/outputs schemas
     *
     * When no output schema is provided, the return type of the runner function
     * will be used directly as the output type, enabling type inference.
     */
    steps: steps
  },
) => StepCollection<z.output<contextSchema>>

/**
 * Configuration shared across all steps
 */
export interface StepCollectionConfig<$Context extends z.Schema = z.Schema> {
  /**
   * TODO
   */
  context?: $Context
  /**
   * TODO
   */
  description?: string
}

/**
 * Create a collection of related workflow steps with shared configuration
 *
 * @example Basic usage
 * ```typescript
 * export default GitHubActions.createStepCollection({
 *   steps: {
 *     build: async ({ core }) => {
 *       await $`pnpm build`
 *       core.info('Build complete')
 *       return { success: true }
 *     },
 *
 *     test: async ({ inputs }) => {
 *       // Access outputs from other steps via namespaced inputs
 *       // In workflow YAML: inputs: { "build": ${{ toJSON(steps.build.outputs) }} }
 *       const buildSuccess = inputs.build?.success
 *       await $`pnpm test`
 *     }
 *   }
 * })
 * ```
 *
 * @example With context validation
 * ```typescript
 * export default GitHubActions.createStepCollection({
 *   context: GitHubActions.contexts.pullRequest,
 *
 *   steps: {
 *     analyze: async ({ context, core }) => {
 *       const pr = context.payload.pull_request
 *       core.info(`Analyzing PR #${pr.number}`)
 *       return { filesChanged: 10, prNumber: pr.number }
 *     },
 *
 *     comment: async ({ inputs, github, context }) => {
 *       // Access analyze step outputs via inputs
 *       // In workflow YAML: inputs: { "analyze": ${{ toJSON(steps.analyze.outputs) }} }
 *       await github.rest.issues.createComment({
 *         owner: context.repo.owner,
 *         repo: context.repo.repo,
 *         issue_number: inputs.analyze?.prNumber,
 *         body: `Found ${inputs.analyze?.filesChanged} files changed`
 *       })
 *     }
 *   }
 * })
 * ```
 *
 * @example Workflow YAML usage
 * ```yaml
 * - name: Analyze
 *   id: analyze
 *   uses: ./.github/actions/step
 *   with:
 *     name: analyze
 *
 * - name: Comment
 *   id: comment
 *   uses: ./.github/actions/step
 *   with:
 *     name: comment
 *     inputs: |
 *       {
 *         "analyze": ${{ toJSON(steps.analyze.outputs) }}
 *       }
 * ```
 */
export const createStepCollection: CreateStepsCollection = (input) => {
  const { steps, ...config } = input

  // Process each step to ensure it has a name from the key
  const processedSteps: Record<string, StepInput> = {}
  for (const [key, def] of Object.entries(steps)) {
    const normalized = normalizeStepInput(def)
    processedSteps[key] = {
      ...normalized,
      name: normalized.name ?? key,
    }
  }

  return {
    config: Object.keys(config).length > 0 ? config : undefined,
    steps: processedSteps,
  }
}

/**
 * Convert a step definition from a collection into a standard Step.
 *
 * This function wraps step definitions to provide:
 * - Automatic input transformation for clean access to kebab-case keys
 * - Context merging from collection-level defaults
 * - Consistent Step interface for the runner
 *
 * The input transformation allows steps to access namespaced inputs using
 * camelCase property names, which are automatically mapped to kebab-case keys.
 * For example: `inputs.distTag` will access `inputs["dist-tag"]`
 */
export const convertToStep = <inputs extends Inputs = Inputs, outputs extends Outputs = Outputs, context = Context>(
  stepDef: StepInput<inputs, outputs, context>,
  stepName: string,
  collection: StepCollection<context>,
): Step => {
  const normalizedStep = normalizeStepInput(stepDef as any)

  // Merge collection config with step config
  const mergedContext = normalizedStep.context ?? collection.config?.context

  // Create the wrapped run function with input transformation
  const wrappedRun = async (args: RunnerArgs<inputs, context>) => {
    // Create a recursive proxy that allows clean access to kebab-case keys
    const createInputsProxy = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj
      }

      return new Proxy(obj, {
        get(target, prop) {
          // Allow symbol access and standard object methods
          if (typeof prop === 'symbol' || prop in target) {
            const value = target[prop as keyof typeof target]
            // Recursively proxy nested objects
            return createInputsProxy(value)
          }

          // Convert camelCase to kebab-case for lookup
          const kebabProp = Str.Case.kebab(String(prop))
          if (kebabProp in target) {
            const value = target[kebabProp as keyof typeof target]
            // Recursively proxy nested objects
            return createInputsProxy(value)
          }

          return undefined
        },
      })
    }

    const inputsProxy = createInputsProxy(args.inputs ?? ({} as inputs))

    // Pass args with proxied inputs
    const argsFacade: RunnerArgs<inputs, context> = {
      ...args,
      inputs: inputsProxy,
    }

    // Run the step
    const result = await normalizedStep.run(argsFacade as any)
    return result ?? {}
  }

  // Return as a standard Step
  return {
    name: normalizedStep.name ?? stepName,
    description: normalizedStep.description || collection.config?.description,
    inputs: normalizedStep.inputs as any,
    outputs: normalizedStep.outputs as any,
    context: mergedContext as any,
    run: wrappedRun as any,
  }
}

/**
 * Type guard to check if a value is a StepCollection
 */
export const isStepCollection = (value: unknown): value is StepCollection<any> => {
  return (
    typeof value === 'object'
    && value !== null
    && 'steps' in value
    && typeof (value as any).steps === 'object'
  )
}

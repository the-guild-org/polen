/**
 * Type-safe steps collection for GitHub Actions workflows
 */

import { brand } from '#lib/kit-temp'
import type { Brand } from '#lib/kit-temp'
import type { z } from 'zod/v4'
import type { Args, CreateInput, Inputs, Outputs, Step } from './step.ts'

/**
 * Branded type for steps collections to enable runtime detection
 */
export type StepsCollection = Brand<StepsCollectionData, 'GitHubActionsStepsCollection'>

/**
 * Internal data structure for steps collections
 */
export interface StepsCollectionData {
  mode: 'simple' | 'configured'
  config?: StepsConfig
  setup?: SetupFunction<any>
  steps: Record<string, StepDefinition<any, any, any>>
}

/**
 * Configuration shared across all steps
 */
export interface StepsConfig {
  context?: z.Schema
  description?: string
}

/**
 * Setup function that runs once before any steps
 */
export type SetupFunction<$SetupResult> = (
  args: Omit<Args, 'inputs'>,
) => Promise<$SetupResult> | $SetupResult

/**
 * Individual step definition in a collection
 */
export type StepDefinition<$Inputs extends Inputs, $Outputs extends Outputs, $Context> =
  | StepFunction<$Inputs, $Outputs, $Context>
  | StepObject<$Inputs, $Outputs, $Context>

/**
 * Function shorthand for simple steps
 */
export type StepFunction<$Inputs extends Inputs, $Outputs extends Outputs, $Context> = (
  args: StepArgs<$Inputs, $Context>,
) => Promise<$Outputs | void> | $Outputs | void

/**
 * Full step object with optional schema definitions
 */
export interface StepObject<$Inputs extends Inputs, $Outputs extends Outputs, $Context> {
  description?: string
  inputs?: z.ZodObject<any>
  outputs?: z.ZodObject<any>
  context?: z.Schema
  needs?: string[]
  run: StepFunction<$Inputs, $Outputs, $Context>
}

/**
 * Arguments passed to step functions in a collection
 */
export type StepArgs<$Inputs extends Inputs, $Context> =
  & Omit<Args<$Inputs, $Context>, 'inputs'>
  & {
    inputs?: $Inputs
    previous?: Record<string, any>
    setup?: any
  }

/**
 * Extract the setup result type from a steps definition
 */
type ExtractSetupResult<T> = T extends { setup: SetupFunction<infer R> } ? R : never

/**
 * Extract previous outputs type based on step dependencies
 */
type ExtractPreviousOutputs<
  TSteps extends Record<string, StepDefinition<any, any, any>>,
  TCurrentStep extends keyof TSteps,
> = {
  [K in keyof TSteps as K extends TCurrentStep ? never : K]: TSteps[K] extends StepFunction<any, infer O, any> ? O
    : TSteps[K] extends StepObject<any, infer O, any> ? O
    : never
}

/**
 * Create a collection of related workflow steps with shared configuration
 *
 * @example Simple mode - just steps
 * ```typescript
 * export default GitHubActions.createSteps({
 *   build: async ({ core }) => {
 *     await $`pnpm build`
 *     core.info('Build complete')
 *   },
 *
 *   test: async ({ previous }) => {
 *     // previous.build is available and typed
 *     await $`pnpm test`
 *   }
 * })
 * ```
 *
 * @example Configured mode - with setup and config
 * ```typescript
 * export default GitHubActions.createSteps({
 *   config: {
 *     context: GitHubActions.contexts.pullRequest,
 *   },
 *
 *   setup: async ({ context }) => ({
 *     pr: context.payload.pull_request,
 *     prNumber: context.payload.pull_request.number
 *   }),
 *
 *   steps: {
 *     analyze: async ({ setup, core }) => {
 *       core.info(`Analyzing PR #${setup.prNumber}`)
 *       return { filesChanged: 10 }
 *     },
 *
 *     comment: async ({ setup, previous, github }) => {
 *       await github.rest.issues.createComment({
 *         issue_number: setup.prNumber,
 *         body: `Found ${previous.analyze.filesChanged} files changed`
 *       })
 *     }
 *   }
 * })
 * ```
 */
export function createSteps<TSteps extends Record<string, StepDefinition<any, any, any>>>(
  steps: TSteps,
): StepsCollection

export function createSteps<
  TSteps extends Record<string, StepDefinition<any, any, any>>,
  TSetup extends SetupFunction<any>,
>(definition: {
  config?: StepsConfig
  setup?: TSetup
  steps: TSteps
}): StepsCollection

export function createSteps(
  input: any,
): StepsCollection {
  let data: StepsCollectionData

  if (input && typeof input === 'object' && 'steps' in input) {
    // Configured mode
    data = {
      mode: 'configured',
      config: input.config,
      setup: input.setup,
      steps: input.steps,
    }
  } else {
    // Simple mode - input is the steps object
    data = {
      mode: 'simple',
      steps: input,
    }
  }

  return brand<StepsCollectionData, 'GitHubActionsStepsCollection'>(data)
}

/**
 * Convert a step definition from a collection into a standard Step
 * This is used by the runner when executing steps from a collection
 */
export function convertToStep<$Inputs extends Inputs, $Outputs extends Outputs, $Context>(
  stepDef: StepDefinition<$Inputs, $Outputs, $Context>,
  stepName: string,
  collection: StepsCollectionData,
): Step {
  // If it's a function, convert to object form
  const stepObj: StepObject<$Inputs, $Outputs, $Context> = typeof stepDef === 'function'
    ? { run: stepDef }
    : stepDef

  // Merge collection config with step config
  const mergedContext = stepObj.context || collection.config?.context

  // Create the wrapped run function that handles setup and previous injection
  const wrappedRun = async (args: Args<$Inputs, $Context>) => {
    // Execute setup if present and not already executed
    let setupResult: any
    if (collection.setup) {
      const setupArgs = {
        ...args,
        inputs: undefined as any, // Remove inputs for setup
      }
      delete setupArgs.inputs
      setupResult = await collection.setup(setupArgs as any)
    }

    // Create a proxy for previous that provides helpful error messages
    const previousRaw = (args.inputs as any)?.previous || {}
    const availableSteps = Object.keys(collection.steps).filter(name => name !== stepName)

    const previous = new Proxy(previousRaw, {
      get(target, prop) {
        const propStr = String(prop)

        // Allow symbol access and standard object methods
        if (typeof prop === 'symbol' || propStr in Object.prototype) {
          return target[prop as keyof typeof target]
        }

        if (!(propStr in target) && availableSteps.includes(propStr)) {
          throw new Error(
            `Step '${stepName}' tried to access previous.${propStr} but it was not provided.\n\n`
              + `To fix this, update your workflow YAML:\n\n`
              + `- name: ${stepName}\n`
              + `  id: ${stepName}\n`
              + `  uses: ./.github/actions/step\n`
              + `  with:\n`
              + `    name: ${stepName}\n`
              + `    previous: |\n`
              + `      {\n`
              + `        "${propStr}": \${{ toJSON(steps.${propStr}.outputs) }}\n`
              + `      }\n\n`
              + `Available steps that can be used as dependencies: ${availableSteps.join(', ')}`,
          )
        }

        return target[propStr]
      },
    })

    // Create the step args with setup and previous
    const stepArgs: StepArgs<$Inputs, $Context> = {
      ...args,
      inputs: args.inputs,
      previous,
      setup: setupResult,
    }

    // Run the step
    const result = await stepObj.run(stepArgs)
    return result || {}
  }

  // Return as a standard Step
  return {
    name: stepName,
    description: stepObj.description || collection.config?.description,
    inputs: stepObj.inputs as any,
    outputs: stepObj.outputs as any,
    context: mergedContext as any,
    run: wrappedRun as any,
  }
}

/**
 * Type guard to check if a value is a StepsCollection
 */
export function isStepsCollection(value: unknown): value is StepsCollection {
  return (
    typeof value === 'object'
    && value !== null
    && '__brand' in value
    && (value as any).__brand === 'GitHubActionsStepsCollection'
  )
}

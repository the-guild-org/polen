/**
 * Type-safe workflow step framework for GitHub Actions
 */

import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import type { Obj } from '@wollybeard/kit'
import { z } from 'zod/v4'
import type { PRController } from './pr-controller.ts'

// Core GitHub Actions context types
export interface Args<$Inputs extends object = {}> {
  core: typeof import('@actions/core')
  github: InstanceType<typeof GitHub>
  context: Context
  $: typeof import('zx').$
  fs: typeof import('node:fs/promises')
  pr: PRController
  inputs: $Inputs
}

// Generic error interface that workflow implementations can extend
export interface WorkflowError extends Error {
  step: string
  cause?: unknown
}

type InputsSchema = z.ZodObject

type OutputsSchema = z.ZodObject

// Generic workflow step definition
export interface StepDefinition<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
> {
  name: string
  description: string
  inputs?: $InputsSchema
  outputs?: $OutputsSchema
  run: (
    args: Args<z.Infer<$InputsSchema>>,
    // todo: Obj.isEmpty ...
  ) => Promise<{} extends z.Infer<$OutputsSchema> ? void : z.Infer<$OutputsSchema>>
}

/**
 * Define a type-safe workflow step
 */
export function defineStep<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
>(
  definition: StepDefinition<$InputsSchema, $OutputsSchema>,
) {
  return async (
    args: Args,
    rawInputs: unknown,
  ): Promise<$OutputsSchema extends undefined ? void : z.Infer<$OutputsSchema>> => {
    const stepName = definition.name

    try {
      // Validate inputs with strict mode to catch excess properties
      const parseResult = definition.inputs?.safeParse(rawInputs)

      let inputs: object = {}
      if (parseResult) {
        if (parseResult.success) {
          inputs = parseResult.data
          throw parseResult.error
        } else {
          throw parseResult.error
        }
      }

      // Check for excess properties if using object schema
      if (definition.inputs instanceof z.ZodObject && typeof rawInputs === 'object' && rawInputs !== null) {
        const knownKeys = Object.keys(definition.inputs.shape)
        const providedKeys = Object.keys(rawInputs)
        const unknownKeys = providedKeys.filter(key => !knownKeys.includes(key))

        if (unknownKeys.length > 0) {
          args.core.warning(
            `Step '${stepName}' received unknown inputs: ${unknownKeys.join(', ')}. These inputs will be ignored.`,
          )
          args.core.debug(`Known inputs: ${knownKeys.join(', ')}`)
          args.core.debug(`Provided inputs: ${JSON.stringify(rawInputs, null, 2)}`)
        }
      }

      args.core.startGroup(`${definition.name}: ${definition.description}`)
      args.core.debug(`Inputs: ${JSON.stringify(inputs)}`)

      //
      // ━━ Execute Step
      //

      const argsWithInputs: Args<z.Infer<InputsSchema>> = {
        ...args,
        inputs: inputs as z.infer<InputsSchema>,
      }

      const outputRaw = await definition.run(argsWithInputs as any)

      //
      // ━━ Validate & Export outputs
      //

      let outputs: Record<string, any> = {}

      if (definition.outputs) {
        outputs = definition.outputs.parse(outputRaw)
        args.core.debug(`Outputs: ${JSON.stringify(outputs)}`)

        // Set GitHub Actions outputs
        for (const [key, value] of Object.entries(outputs)) {
          args.core.setOutput(key, typeof value === 'string' ? value : JSON.stringify(value))
        }

        args.core.endGroup()
      }

      //
      // ━━ Ensure No Outputs
      //

      if (outputs) {
        args.core.warning(
          `Step did not define outputs schema, but returned outputs. These will not be validated or exoprted. Outputs were: ${
            JSON.stringify(outputs)
          }`,
        )
      }

      args.core.endGroup()

      return outputs as any
    } catch (error) {
      args.core.endGroup()

      // Log error details once
      if (error instanceof z.ZodError) {
        args.core.error(`Validation error in step ${stepName}: ${error.message}`)
        args.core.debug(`Validation issues: ${JSON.stringify(error.issues, null, 2)}`)
        args.core.debug(`Received data: ${JSON.stringify(rawInputs, null, 2)}`)
      } else if (error instanceof Error) {
        args.core.error(`Step ${stepName} failed: ${error.message}`)
        args.core.debug(`Stack: ${error.stack}`)
      } else {
        args.core.error(`Step ${stepName} failed: ${String(error)}`)
      }

      // Re-throw the error - let the consumer handle error wrapping
      throw error
    }
  }
}

// Common input/output schemas
export const CommonSchemas = {
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Must be valid semver'),
  sha: z.string().regex(/^[a-f0-9]{7,40}$/, 'Must be valid git SHA'),
  prNumber: z.string().regex(/^\d+$/, 'Must be valid PR number'),
  boolean: z.union([z.boolean(), z.string().transform(s => s === 'true')]),
  jsonString: <T>(schema: z.ZodSchema<T>) => z.string().transform(s => schema.parse(JSON.parse(s))),
} as const

/**
 * Workflow orchestration utilities
 */
export class WorkflowOrchestrator {
  constructor(private context: Args) {}

  async executeSteps<T extends Record<string, any>>(
    steps: Array<{
      name: string
      step: (context: Args, inputs?: any) => Promise<any>
      inputs?: any
      continueOnError?: boolean
    }>,
  ): Promise<T> {
    const results: Record<string, any> = {}

    for (const { name, step, inputs, continueOnError = false } of steps) {
      try {
        this.context.core.info(`🚀 Executing step: ${name}`)
        results[name] = await step(this.context, inputs)
        this.context.core.info(`✅ Completed step: ${name}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.context.core.error(`❌ Failed step: ${name} - ${errorMessage}`)

        if (!continueOnError) {
          throw error
        }

        results[name] = { error }
      }
    }

    return results as T
  }
}

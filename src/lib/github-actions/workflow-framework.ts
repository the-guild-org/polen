/**
 * Type-safe workflow step framework for GitHub Actions
 */

import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { z } from 'zod/v4'

// Core GitHub Actions context types
export interface WorkflowContext {
  core: typeof import('@actions/core')
  github: InstanceType<typeof GitHub>
  context: Context
  $: typeof import('zx').$
  fs: typeof import('node:fs/promises')
}

// Generic error interface that workflow implementations can extend
export interface IWorkflowError extends Error {
  step: string
  cause?: unknown
}

// Generic workflow step definition
export interface WorkflowStepDefinition<$Inputs, $Outputs> {
  name: string
  description: string
  inputs: z.ZodSchema<$Inputs>
  outputs: z.ZodSchema<$Outputs>
  execute: (context: WorkflowContext & { inputs: $Inputs }) => Promise<$Outputs>
}

/**
 * Define a type-safe workflow step
 */
export function defineWorkflowStep<$Inputs, $Outputs>(
  definition: WorkflowStepDefinition<$Inputs, $Outputs>,
) {
  return async (context: WorkflowContext, rawInputs: unknown): Promise<$Outputs> => {
    const stepName = definition.name

    try {
      // Validate inputs
      const inputs = definition.inputs.parse(rawInputs)

      context.core.startGroup(`${definition.name}: ${definition.description}`)
      context.core.debug(`Inputs: ${JSON.stringify(inputs)}`)

      // Execute step
      const outputs = await definition.execute({ ...context, inputs })

      // Validate outputs
      const validatedOutputs = definition.outputs.parse(outputs)

      context.core.debug(`Outputs: ${JSON.stringify(validatedOutputs)}`)

      // Set GitHub Actions outputs
      for (const [key, value] of Object.entries(validatedOutputs as Record<string, any>)) {
        context.core.setOutput(key, typeof value === 'string' ? value : JSON.stringify(value))
      }

      context.core.endGroup()
      return validatedOutputs
    } catch (error) {
      context.core.endGroup()
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
  constructor(private context: WorkflowContext) {}

  async executeSteps<T extends Record<string, any>>(
    steps: Array<{
      name: string
      step: (context: WorkflowContext, inputs?: any) => Promise<any>
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

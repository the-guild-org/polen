/**
 * Type-safe workflow step framework for GitHub Actions
 */

import { z } from 'zod'
import type { GitHub } from '@actions/github/lib/utils.js'
import type { Context } from '@actions/github/lib/context.js'
import { WorkflowError } from './error-handling.ts'

// Core GitHub Actions context types
export interface WorkflowContext {
  core: typeof import('@actions/core')
  github: InstanceType<typeof GitHub>
  context: Context
  $: typeof import('zx').$
  fs: typeof import('node:fs/promises')
}

// Generic workflow step definition
export interface WorkflowStepDefinition<TInputs, TOutputs> {
  name: string
  description: string
  inputs: z.ZodSchema<TInputs>
  outputs: z.ZodSchema<TOutputs>
  execute: (context: WorkflowContext & { inputs: TInputs }) => Promise<TOutputs>
}

/**
 * Define a type-safe workflow step
 */
export function defineWorkflowStep<TInputs, TOutputs>(
  definition: WorkflowStepDefinition<TInputs, TOutputs>,
) {
  return async (context: WorkflowContext, rawInputs: unknown): Promise<TOutputs> => {
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
      for (const [key, value] of Object.entries(validatedOutputs)) {
        context.core.setOutput(key, typeof value === 'string' ? value : JSON.stringify(value))
      }

      context.core.endGroup()
      return validatedOutputs
    } catch (error) {
      context.core.endGroup()
      throw WorkflowError.wrap(stepName, error)
    }
  }
}

// Common input/output schemas
export const CommonSchemas = {
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Must be valid semver'),
  sha: z.string().regex(/^[a-f0-9]{7,40}$/, 'Must be valid git SHA'),
  prNumber: z.string().regex(/^\d+$/, 'Must be valid PR number'),
  boolean: z.union([z.boolean(), z.string().transform(s => s === 'true')]),
  jsonString: <T>(schema: z.ZodSchema<T>) => 
    z.string().transform(s => schema.parse(JSON.parse(s))),
} as const

// Utility for creating simple string-based steps (backwards compatibility)
export function createLegacyStep<TInputs = Record<string, string>>(
  execute: (context: WorkflowContext & { inputs: TInputs }) => Promise<void>,
) {
  return async (context: WorkflowContext): Promise<void> => {
    const inputs = context.core.getInput as any // Legacy compatibility
    await execute({ ...context, inputs })
  }
}

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
        const workflowError = WorkflowError.wrap(name, error)
        this.context.core.error(`❌ Failed step: ${name} - ${workflowError.message}`)
        
        if (!continueOnError) {
          throw workflowError
        }
        
        results[name] = { error: workflowError }
      }
    }

    return results as T
  }
}
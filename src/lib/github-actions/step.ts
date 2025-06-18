/**
 * Type-safe workflow step framework for GitHub Actions
 */

import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { z } from 'zod/v4'
import type { PRController } from './pr-controller.ts'

// Core GitHub Actions context types
export interface Args<$Inputs extends object = {}, $Context = Context> {
  core: typeof import('@actions/core')
  github: InstanceType<typeof GitHub>
  context: $Context
  $: typeof import('zx').$
  fs: typeof import('node:fs/promises')
  pr: PRController
  inputs: $Inputs
}

export type StepFunction<
  $Inputs extends Record<string, any> = Record<string, any>,
  $Outputs = any,
  $Context = Context,
> = (
  context: Args<$Inputs, $Context>,
) => Promise<$Outputs>

type InputsSchema = z.ZodObject

type OutputsSchema = z.ZodObject

// Generic workflow step definition
export interface StepDefinition<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string
  description: string
  inputs?: $InputsSchema
  outputs?: $OutputsSchema
  context?: $ContextSchema
  run: (
    args: Args<z.Infer<$InputsSchema>, $ContextSchema extends z.ZodTypeAny ? z.Infer<$ContextSchema> : Context>,
    // todo: Obj.isEmpty ...
  ) => Promise<{} extends z.Infer<$OutputsSchema> ? void : z.Infer<$OutputsSchema>>
}

// Export the full step definition for runner
export interface ExportedStep<
  $InputsSchema extends InputsSchema = InputsSchema,
  $OutputsSchema extends OutputsSchema = OutputsSchema,
  $ContextSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  definition: StepDefinition<$InputsSchema, $OutputsSchema, $ContextSchema>
  execute: StepFunction<
    z.Infer<$InputsSchema>,
    z.Infer<$OutputsSchema>,
    $ContextSchema extends z.ZodTypeAny ? z.Infer<$ContextSchema> : Context
  >
}

/**
 * Define a type-safe workflow step
 */
export function defineStep<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends z.ZodTypeAny = z.ZodTypeAny,
>(
  definition: StepDefinition<$InputsSchema, $OutputsSchema, $ContextSchema>,
): ExportedStep<$InputsSchema, $OutputsSchema, $ContextSchema> {
  const execute = async (args: Args<z.Infer<$InputsSchema>, any>) => {
    const outputRaw = await definition.run(args as any)
    return outputRaw as z.Infer<$OutputsSchema>
  }

  return {
    definition,
    execute,
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

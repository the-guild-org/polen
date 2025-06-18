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

export type Runner<
  $Inputs extends Record<string, any> = Record<string, any>,
  $Outputs = any,
  $Context = Context,
> = (
  context: Args<$Inputs, $Context>,
) => Promise<$Outputs>

type InputsSchema = z.ZodObject

type OutputsSchema = z.ZodObject

// Generic workflow step definition
export interface Definition<
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
export interface Step<
  $InputsSchema extends InputsSchema = InputsSchema,
  $OutputsSchema extends OutputsSchema = OutputsSchema,
  $ContextSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  definition: Definition<$InputsSchema, $OutputsSchema, $ContextSchema>
  run: Runner<
    z.Infer<$InputsSchema>,
    z.Infer<$OutputsSchema>,
    $ContextSchema extends z.ZodTypeAny ? z.Infer<$ContextSchema> : Context
  >
}

/**
 * Define a type-safe workflow step
 */
export function createStep<
  $InputsSchema extends InputsSchema,
  $OutputsSchema extends OutputsSchema,
  $ContextSchema extends z.ZodTypeAny = z.ZodTypeAny,
>(
  definition: Definition<$InputsSchema, $OutputsSchema, $ContextSchema>,
): Step<$InputsSchema, $OutputsSchema, $ContextSchema> {
  const run = async (args: Args<z.Infer<$InputsSchema>, any>) => {
    const outputRaw = await definition.run(args as any)
    return outputRaw as z.Infer<$OutputsSchema>
  }

  return {
    definition,
    run,
  }
}

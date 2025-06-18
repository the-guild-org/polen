/**
 * Type-safe workflow step framework for GitHub Actions
 */

// import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { z } from 'zod/v4'
import type { PRController } from './pr-controller.ts'
import type { Context, ContextSchema as RealContextSchema } from './schemas/context.ts'

// Core GitHub Actions context types
export interface Args<$Inputs extends Inputs = Inputs, $Context = Context> {
  core: typeof import('@actions/core')
  context: $Context
  inputs: $Inputs
  github: InstanceType<typeof GitHub>
  $: typeof import('zx').$
  fs: typeof import('node:fs/promises')
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
 * Define a type-safe workflow step
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

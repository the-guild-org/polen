import type { z } from 'zod/v4'
import type { Context } from './runner-args-context.ts'
import type { Runner } from './runner.ts'

export type Outputs = object

export type Inputs = object

export interface Step<
  $Inputs extends Inputs = Inputs,
  $Outputs extends Outputs = Outputs,
  $Context = Context,
> {
  name: string
  description?: string
  inputs?: z.ZodObject<any>
  outputs?: z.ZodObject<any>
  context?: z.Schema
  run: Runner<$Inputs, $Outputs, $Context>
}

/**
 * Infer the output type from a runner function
 */
export type InferRunnerOutputs<T> = T extends Runner<any, infer O, any> ? O : never

/**
 * Infer the output type from a step input
 */
export type InferStepOutputs<T extends StepInput> = T extends { outputs: z.ZodObject<any> } ? z.output<T['outputs']>
  : T extends { run: infer R } ? InferRunnerOutputs<R>
  : T extends Runner<any, infer O, any> ? O
  : never

export type StepInput<
  $Inputs extends Inputs = Inputs,
  $Outputs extends Outputs = Outputs,
  $Context = Context,
> =
  | Runner<$Inputs, $Outputs, $Context>
  | StepInputConfig<$Inputs, $Outputs, $Context>

export type StepInputConfig<
  $Inputs extends Inputs = Inputs,
  $Outputs extends Outputs = Outputs,
  $Context = Context,
> = Omit<Step<$Inputs, $Outputs, $Context>, 'name'> & { name?: string }

export const normalizeStepInput = (stepInput: StepInput): StepInputConfig => {
  const def = typeof stepInput === 'function'
    ? { run: stepInput }
    : stepInput

  return def
}

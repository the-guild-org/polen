import { createRunnerArgs, type RunnerArgs } from '#lib/github-actions/runner-args'
import * as core from '@actions/core'
import { context } from '@actions/github'
import { Obj, Path, Str } from '@wollybeard/kit'
import { z } from 'zod/v4'
import type { Context } from './runner-args-context.ts'
import { searchModule } from './search-module.ts'
import { convertToStep, isStepCollection } from './step-collection.ts'
import type { Inputs, Outputs, Step } from './step.ts'

export type Runner<
  $Inputs extends Inputs = Inputs,
  $Outputs extends Outputs = Outputs,
  $Context = Context,
> = <args extends RunnerArgs<$Inputs, $Context>>(args: args) => Promise<$Outputs>

/**
 * Run a workflow step by name using discovery
 */
export async function runStepByName(
  stepName: string,
  workflowName?: string,
  inputsJson?: string,
): Promise<void> {
  // Discover the step module
  const moduleLocation = searchModule({ stepName, workflowName })

  if (!moduleLocation.found || !moduleLocation.path) {
    core.error(`Step '${stepName}' not found`)
    core.error(`Searched paths:`)
    moduleLocation.searchedPaths.forEach(path => {
      core.error(`  - ${path}`)
    })
    throw new Error(`Step '${stepName}' not found`)
  }

  core.debug(`Found step at: ${moduleLocation.path}`)
  await runStep(moduleLocation.path, inputsJson, stepName)
}

/**
 * Run a workflow step by importing it from a path
 */
export async function runStep(
  stepPath: string,
  inputsJson?: string,
  requestedStepName?: string,
): Promise<void> {
  const rawInputs = inputsJson ? JSON.parse(inputsJson) : {}

  try {
    // Dynamically import the step module
    let stepModule: any

    // Convert to absolute path for import
    const { resolve } = await import(`node:path`)
    const { pathToFileURL } = await import(`node:url`)

    // Resolve to absolute path and convert to file URL for proper ESM import
    const absolutePath = resolve(process.cwd(), stepPath)
    const importUrl = pathToFileURL(absolutePath).href

    stepModule = await import(importUrl)

    // Module must export a StepCollection
    if (!isStepCollection(stepModule.default)) {
      throw new Error(`Module at ${stepPath} does not export a valid step collection as default export`)
    }

    // Extract the requested step from the collection
    if (!requestedStepName) {
      throw new Error(`Step name is required when using a steps collection`)
    }

    const collection = stepModule.default
    const stepDef = collection.steps[requestedStepName]

    if (!stepDef) {
      const availableSteps = Object.keys(collection.steps)
      throw new Error(
        `Step '${requestedStepName}' not found in collection.\n`
          + `Available steps: ${availableSteps.join(', ')}`,
      )
    }

    // Convert the step definition to a standard Step
    const step = convertToStep(stepDef, requestedStepName, collection)

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Process Step Definition
    // Validate Inputs
    // Warning about excess properties
    // Validate expected GitHub event versus actual
    //
    //

    const stepName = step.name

    // todo: allow step definition to opt-out of runtime validation
    // Validate context if schema is provided
    let validatedContext: any = context
    if (step.context) {
      const contextValidation = step.context.safeParse(context)
      if (!contextValidation.success) {
        const errorMessage = `Step '${stepName}' expects a different GitHub event context`
        core.error(errorMessage)
        core.error(`Expected context: ${JSON.stringify(contextValidation.error.issues, null, 2)}`)
        core.error(`Actual event: ${context.eventName}`)

        // For now, default to hard error. We can make this configurable later
        throw new Error(errorMessage)
      }
      validatedContext = contextValidation.data
    }

    // Validate inputs
    let inputs: Record<string, unknown> = {}
    if (step.inputs) {
      const parseResult = step.inputs.safeParse(rawInputs)
      if (parseResult.success) {
        inputs = parseResult.data
      } else {
        core.error(`Validation error in step ${stepName}: ${parseResult.error.message}`)
        core.debug(`Validation issues: ${JSON.stringify(parseResult.error.issues, null, 2)}`)
        core.debug(`Received data: ${JSON.stringify(rawInputs, null, 2)}`)
        throw parseResult.error
      }
    }

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Run Step
    //
    //

    // Create context with validated inputs
    const args = createRunnerArgs(stepName)
    const stepArgs = {
      ...args,
      context: validatedContext,
      inputs: inputs as any,
    }

    core.startGroup(`${step.name}: ${step.description ?? ''}`)
    core.debug(`Inputs: ${JSON.stringify(inputs)}`)

    // Execute step
    const outputRaw = await step.run(stepArgs)

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Handle Step Output
    //
    //

    // Handle outputs
    if (step.outputs) {
      // If schema is provided, validate outputs
      const outputs = step.outputs.parse(outputRaw)
      const json = JSON.stringify(outputs)
      core.setOutput(`json`, json)
      for (const [key, value] of Obj.entries(outputs)) {
        // todo: if key === json raise an error, it is a reserved name
        core.setOutput(key, Str.is(value) ? value : JSON.stringify(value))
      }
    } else if (outputRaw !== undefined && outputRaw !== null && typeof outputRaw === 'object') {
      // No schema provided, but outputs were returned - use them directly
      // This enables output type inference without explicit schemas
      const outputs = outputRaw as Record<string, unknown>
      const json = JSON.stringify(outputs)
      core.setOutput(`json`, json)
      for (const [key, value] of Obj.entries(outputs)) {
        core.setOutput(key, Str.is(value) ? value : JSON.stringify(value))
      }
      core.debug(`Step returned outputs without schema validation: ${json}`)
    }

    core.endGroup()
  } catch (error) {
    core.endGroup()

    // Log error details once (if not already logged)
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      core.error(`Step failed: ${error.message}`)
      core.debug(`Stack: ${error.stack}`)
    } else if (!(error instanceof z.ZodError)) {
      core.error(`Step failed: ${String(error)}`)
    }

    if (inputsJson) {
      core.debug(`Step inputs: ${inputsJson}`)
    }

    // Re-throw to let CLI handle the error
    throw error
  }
}

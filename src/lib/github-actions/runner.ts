/**
 * Runner utilities for executing workflow steps in GitHub Actions
 */

import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { Obj, Path, Str } from '@wollybeard/kit'
import { promises as fs } from 'node:fs'
import { z } from 'zod/v4'
import { $ } from 'zx'
import { WorkflowError } from './error-handling.ts'
import { createGitController } from './git-controller.ts'
import { createPRController } from './pr-controller.ts'
import { searchModule } from './search-module.ts'
import type { Args, Step } from './step.ts'

/**
 * Create a workflow context with all necessary tools
 */
export function createArgs(stepName: string): Args {
  const githubToken = process.env['GITHUB_TOKEN']
  if (!githubToken) {
    throw new WorkflowError('runner', 'GITHUB_TOKEN environment variable is required')
  }

  const github = getOctokit(githubToken)
  const pr = createPRController(github, context, stepName)
  const git = createGitController($)

  return {
    core,
    github,
    context,
    $,
    fs,
    pr,
    git,
    inputs: {},
  }
}

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
    moduleLocation.searchedPaths.forEach(path => core.error(`  - ${path}`))
    throw new WorkflowError('runner', `Step '${stepName}' not found`)
  }

  core.debug(`Found step at: ${moduleLocation.path}`)
  await runStep(moduleLocation.path, inputsJson)
}

/**
 * Run a workflow step by importing it from a path
 */
export async function runStep(
  stepPath: string,
  inputsJson?: string,
): Promise<void> {
  const rawInputs = inputsJson ? JSON.parse(inputsJson) : {}

  try {
    // Dynamically import the step module
    let stepModule: any

    // Check if this is a test scenario (mocked module)
    if (process.env['NODE_ENV'] === 'test' && stepPath.startsWith('./test-')) {
      // For tests, use direct import path
      stepModule = await import(stepPath)
    } else {
      // For real usage, convert to absolute path
      const { resolve } = await import('node:path')
      const { pathToFileURL } = await import('node:url')

      // Resolve to absolute path and convert to file URL for proper ESM import
      const absolutePath = resolve(process.cwd(), stepPath)
      const importUrl = pathToFileURL(absolutePath).href

      stepModule = await import(importUrl)
    }

    const step: Step = stepModule.default

    if (!step || !step.run || !step.definition) {
      throw new Error(`Module at ${stepPath} does not export a valid workflow step as default export`)
    }

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

    const { definition } = step
    const stepName = definition.name ?? Path.parse(stepPath).name

    // todo: allow step definition to opt-out of runtime validation
    // Validate context if schema is provided
    let validatedContext: any = context
    if (definition.contextSchema) {
      const contextValidation = definition.contextSchema.safeParse(context)
      if (!contextValidation.success) {
        const errorMessage = `Step '${stepName}' expects a different GitHub event context`
        core.error(errorMessage)
        core.error(`Expected context: ${JSON.stringify(contextValidation.error.issues, null, 2)}`)
        core.error(`Actual event: ${context.eventName}`)

        // For now, default to hard error. We can make this configurable later
        throw new WorkflowError('runner', errorMessage)
      }
      validatedContext = contextValidation.data
    }

    // Validate inputs
    let inputs: Record<string, unknown> = {}
    if (definition.inputsSchema) {
      const parseResult = definition.inputsSchema.safeParse(rawInputs)
      if (parseResult.success) {
        inputs = parseResult.data
      } else {
        core.error(`Validation error in step ${stepName}: ${parseResult.error.message}`)
        core.debug(`Validation issues: ${JSON.stringify(parseResult.error.issues, null, 2)}`)
        core.debug(`Received data: ${JSON.stringify(rawInputs, null, 2)}`)
        throw parseResult.error
      }

      // todo: let step define if it wants to silence this warning
      // Check for excess properties if using object schema
      if (definition.inputsSchema instanceof z.ZodObject && typeof rawInputs === 'object' && rawInputs !== null) {
        const knownKeys = Object.keys(definition.inputsSchema.shape)
        const providedKeys = Object.keys(rawInputs)
        const unknownKeys = providedKeys.filter(key => !knownKeys.includes(key))

        if (unknownKeys.length > 0) {
          core.warning(
            `Step '${stepName}' received unknown inputs: ${unknownKeys.join(', ')}. These inputs will be ignored.`,
          )
          core.debug(`Known inputs: ${knownKeys.join(', ')}`)
          core.debug(`Provided inputs: ${JSON.stringify(rawInputs, null, 2)}`)
        }
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
    const args = createArgs(stepName)
    const stepArgs = {
      ...args,
      context: validatedContext,
      inputs: inputs as any,
    }

    core.startGroup(`${definition.name}: ${definition.description}`)
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

    // Validate & Export outputs
    // todo: allow step definition to opt-out of output validation
    if (definition.outputsSchema) {
      const outputs = definition.outputsSchema.parse(outputRaw)
      const json = JSON.stringify(outputs)
      core.setOutput('json', json)
      for (const [key, value] of Obj.entries(outputs)) {
        // todo: if key === json raise an error, it is a reserved name
        core.setOutput(key, Str.is(value) ? value : JSON.stringify(value))
      }
    } else if (outputRaw !== undefined && outputRaw !== null) {
      core.warning(
        `Step did not define outputs schema, but returned outputs. These will not be validated or exported. Outputs were: ${
          JSON.stringify(outputRaw)
        }`,
      )
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

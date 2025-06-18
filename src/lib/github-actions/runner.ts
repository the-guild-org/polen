/**
 * Runner utilities for executing workflow steps in GitHub Actions
 */

import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import { WorkflowError } from './error-handling.ts'
import type { WorkflowStep } from './types.ts'
import type { WorkflowContext } from './workflow-framework.ts'

/**
 * Create a workflow context with all necessary tools
 */
export function createWorkflowContext(): WorkflowContext {
  const githubToken = process.env['GITHUB_TOKEN']
  if (!githubToken) {
    throw new WorkflowError('runner', 'GITHUB_TOKEN environment variable is required')
  }

  return {
    core,
    github: getOctokit(githubToken),
    context,
    $,
    fs,
  }
}

/**
 * Run a workflow step by importing it from a path
 */
export async function runStep(
  stepPath: string,
  inputsJson?: string,
): Promise<void> {
  const inputs = inputsJson ? JSON.parse(inputsJson) : {}

  try {
    // Dynamically import the step module
    const stepModule = await import(stepPath)
    const step: WorkflowStep = stepModule.default

    if (!step || typeof step !== 'function') {
      throw new Error(`Module at ${stepPath} does not export a valid workflow step as default export`)
    }

    // Create context and run the step
    const context = createWorkflowContext()
    await step(context, inputs)
  } catch (error) {
    core.error(`❌ Error running step from ${stepPath}`)

    if (error instanceof SyntaxError && inputsJson) {
      core.error(`Invalid JSON inputs: ${inputsJson}`)
      core.error(`SyntaxError details: ${error.message}`)
    } else if (error instanceof WorkflowError) {
      // WorkflowError already handles logging via core.setFailed
      core.error(`WorkflowError: ${error.message}`)
      if (error.cause) {
        core.error(`Caused by: ${error.cause}`)
      }
    } else if (error instanceof Error) {
      core.error(`Error type: ${error.constructor.name}`)
      core.error(`Error message: ${error.message}`)
      if (error.stack) {
        core.error(`Stack trace:`)
        error.stack.split('\n').forEach(line => core.error(line))
      }

      // Check for module resolution errors
      if (error.message.includes('Cannot find module') || error.message.includes('MODULE_NOT_FOUND')) {
        core.error(`This appears to be a module import error.`)
        core.error(`Check that the step file exists at: ${stepPath}`)
        core.error(`Ensure all dependencies are properly installed.`)
      }

      // Check for TypeScript errors
      if (error.message.includes('Unexpected token') || error.message.includes('SyntaxError')) {
        core.error(`This appears to be a TypeScript compilation error.`)
        core.error(`Ensure Node.js is running with --experimental-transform-types flag.`)
      }
    } else {
      core.error(`Unknown error type: ${typeof error}`)
      core.error(`Error value: ${String(error)}`)
    }

    // Log the inputs for debugging
    if (inputsJson) {
      core.error(`Step inputs: ${inputsJson}`)
    }

    core.setFailed(`Step execution failed`)
    process.exit(1)
  }
}

/**
 * Runner utilities for executing workflow steps in GitHub Actions
 */

import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import { WorkflowError } from './error-handling.ts'
import type { WorkflowContext } from './workflow-framework.ts'
import type { WorkflowStep } from './types.js'

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
 * Registry of workflow steps
 */
export interface WorkflowStepRegistry {
  [key: string]: WorkflowStep<any>
}

/**
 * Run a workflow step from a registry
 */
export async function runWorkflowStep(
  stepName: string,
  inputs: unknown,
  registry: WorkflowStepRegistry,
): Promise<void> {
  const step = registry[stepName]
  if (!step) {
    throw new WorkflowError('runner', `Unknown workflow step: ${stepName}`)
  }

  try {
    core.info(`🚀 Running workflow step: ${stepName}`)
    core.debug(`Inputs: ${JSON.stringify(inputs, null, 2)}`)

    const workflowContext = createWorkflowContext()
    await step(workflowContext, inputs)

    core.info(`✅ Completed workflow step: ${stepName}`)
  } catch (error) {
    const workflowError = WorkflowError.wrap('runner', error)
    core.error(`❌ Failed workflow step: ${stepName} - ${workflowError.message}`)

    if (workflowError.cause) {
      core.debug(`Caused by: ${workflowError.cause}`)
    }

    core.setFailed(workflowError.message)
    throw workflowError
  }
}

/**
 * CLI runner for workflow steps
 */
export async function runWorkflowStepCLI(registry: WorkflowStepRegistry): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: node runner.ts <step-name> [inputs-json]')
    console.error('')
    console.error('Available steps:')
    Object.keys(registry).forEach(step => {
      console.error(`  - ${step}`)
    })
    process.exit(1)
  }

  const stepName = args[0]!
  const inputsJson = args[1] || '{}'

  if (!registry[stepName]) {
    console.error(`❌ Unknown workflow step: ${stepName}`)
    console.error('')
    console.error('Available steps:')
    Object.keys(registry).forEach(step => {
      console.error(`  - ${step}`)
    })
    process.exit(1)
  }

  try {
    const inputs = JSON.parse(inputsJson)
    await runWorkflowStep(stepName, inputs, registry)
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('❌ Invalid JSON inputs:', inputsJson)
    } else if (error instanceof WorkflowError) {
      // Already logged by runWorkflowStep
    } else {
      console.error('❌ Unexpected error:', error)
    }
    process.exit(1)
  }
}

/**
 * Run a workflow step by importing it from a path
 */
export async function runWorkflowStepFromPath(
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
    if (error instanceof SyntaxError && inputsJson) {
      console.error(`❌ Invalid JSON inputs: ${inputsJson}`)
    } else if (error instanceof WorkflowError) {
      // WorkflowError already handles logging via core.setFailed
    } else {
      console.error(`❌ Error running step from ${stepPath}:`, error)
    }
    process.exit(1)
  }
}
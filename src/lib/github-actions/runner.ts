/**
 * Runner utilities for executing workflow steps in GitHub Actions
 */

import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import { WorkflowError } from './error-handling.ts'
import type { WorkflowStep } from './types.js'
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

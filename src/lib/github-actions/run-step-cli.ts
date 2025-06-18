#!/usr/bin/env node
/**
 * CLI for running workflow steps
 *
 * This is designed to be called from GitHub Actions workflows
 * with our convention of steps being in .github/steps/<name>.ts
 */

import * as core from '@actions/core'
import { join } from 'node:path'
import { runStep } from './runner.ts'

async function main() {
  const stepName = process.argv[2]
  const inputsJson = process.argv[3] || '{}'
  const contextJson = process.argv[4] || '{}'
  const previousJson = process.argv[5] || '{}'

  if (!stepName) {
    core.setFailed('Missing required step name parameter')
    core.error('Usage: run-step-cli <step-name> [inputs-json] [context-json] [previous-json]')
    core.error('This runner expects steps to be in .github/steps/<name>.ts')
    process.exit(1)
  }

  const currentDir = process.cwd()
  const stepPath = join(currentDir, '.github/steps', `${stepName}.ts`)

  try {
    core.info(`Running workflow step: ${stepName}`)

    // Parse all inputs
    const inputs = JSON.parse(inputsJson)
    const context = JSON.parse(contextJson)
    const previous = JSON.parse(previousJson)

    // Debug logging
    core.debug(`Parsed inputs: ${JSON.stringify(inputs)}`)
    core.debug(`Parsed context keys: ${Object.keys(context).join(', ')}`)
    core.debug(`Parsed previous: ${JSON.stringify(previous)}`)

    // Merge all inputs together, always including context and previous
    const mergedInputs = {
      ...inputs,
      context,
      previous,
    }

    core.debug(`Merged inputs: ${JSON.stringify(mergedInputs)}`)

    await runStep(stepPath, JSON.stringify(mergedInputs))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    core.error(`Failed to run step ${stepName}: ${message}`)
    if (stack) {
      core.error(`Stack trace:`)
      core.error(stack)
    }

    // Log additional context
    core.error(`Step path: ${stepPath}`)
    core.error(`Inputs: ${inputsJson}`)
    core.error(`Context: ${contextJson}`)
    core.error(`Previous: ${previousJson}`)

    // Check for common issues
    if (error instanceof Error) {
      if (error.message.includes('Cannot find module')) {
        core.error(`Module import error - check that all dependencies are installed`)
      } else if (error.message.includes('SyntaxError')) {
        core.error(`Syntax error in step file - check TypeScript compilation`)
      }
    }

    core.setFailed(`Step execution failed: ${message}`)
    process.exit(1)
  }
}

main()

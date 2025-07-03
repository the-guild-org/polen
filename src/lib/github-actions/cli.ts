#!/usr/bin/env node
/**
 * CLI for running workflow steps
 *
 * This is designed to be called from GitHub Actions workflows
 * with our convention of steps being in .github/steps/<name>.ts
 */

import * as core from '@actions/core'
import { runStep, runStepByName } from './runner.ts'

async function main() {
  const stepName = process.argv[2]
  const workflowName = process.argv[3]
  const pathOverride = process.argv[4]
  const inputsJson = process.argv[5] || `{}`
  const previousJson = process.argv[7] || `{}`

  if (!stepName) {
    core.setFailed(`Missing required step name parameter`)
    core.error(
      `Usage: run-step-cli <step-name> <workflow-name> [path-override] [inputs-json] [previous-json]`,
    )
    core.error(`This runner expects steps to be in .github/steps/<name>.ts`)
    process.exit(1)
  }

  // Module discovery is now handled by the runner

  try {
    core.info(`Running workflow step: ${stepName}`)

    // Parse all inputs
    const inputs = JSON.parse(inputsJson)
    const previous = JSON.parse(previousJson)

    // Debug logging
    core.debug(`Parsed inputs: ${JSON.stringify(inputs)}`)
    core.debug(`Parsed previous: ${JSON.stringify(previous)}`)

    const mergedInputs = {
      ...inputs,
      previous,
    }

    core.debug(`Merged inputs: ${JSON.stringify(mergedInputs)}`)

    // If path override is provided and not empty, use it directly
    if (pathOverride && pathOverride !== ``) {
      await runStep(pathOverride, JSON.stringify(mergedInputs))
    } else {
      await runStepByName(stepName, workflowName, JSON.stringify(mergedInputs))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    core.error(`Failed to run step ${stepName}: ${message}`)
    if (stack) {
      core.error(`Stack trace:`)
      core.error(stack)
    }

    core.error(`Step name: ${stepName}`)
    core.error(`Workflow name: ${workflowName || `none`}`)
    core.error(`Path override: ${pathOverride || `none`}`)
    core.error(`Inputs: ${inputsJson}`)
    core.error(`Previous: ${previousJson}`)

    // Check for common issues
    if (error instanceof Error) {
      if (error.message.includes(`Cannot find module`)) {
        core.error(`Module import error - check that all dependencies are installed`)
      } else if (error.message.includes(`SyntaxError`)) {
        core.error(`Syntax error in step file - check TypeScript compilation`)
      }
    }

    core.setFailed(`Step execution failed: ${message}`)
    process.exit(1)
  }
}

main()

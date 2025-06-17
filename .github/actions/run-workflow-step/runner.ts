#!/usr/bin/env node --no-warnings

import * as core from '@actions/core'
import { context } from '@actions/github'
import { getOctokit } from '@actions/github'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import type { WorkflowStepArgs } from '../../workflow-steps/types.ts'

interface RunOptions {
  step: string
  inputs: Record<string, any>
}

export async function run({ step, inputs }: RunOptions): Promise<void> {
  core.info(`Runner started for step: ${step}`)

  try {
    const token = process.env['GITHUB_TOKEN']

    if (!step) {
      throw new Error('Step path argument is required')
    }

    // Debug logging
    if (core.isDebug()) {
      core.debug(`Loading workflow step: ${step}`)
      core.debug(`Inputs: ${JSON.stringify(inputs)}`)
    }

    // Import the step module
    const scriptPath = `${process.env['GITHUB_WORKSPACE']}/.github/workflow-steps/${step}`
    core.info(`Loading workflow step from: ${scriptPath}`)

    let script
    try {
      const module = await import(scriptPath)
      script = module.default
      core.debug(`Successfully loaded workflow step`)
    } catch (error) {
      core.error(`Failed to import workflow step: ${error}`)
      throw error
    }

    // Parse any stringified JSON values within the inputs
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        // Parse any valid JSON string, including arrays, objects, null, booleans, numbers
        if (
          value === 'null' || value === 'true' || value === 'false'
          || /^-?\d+(\.\d+)?$/.test(value) || value.startsWith('[') || value.startsWith('{') || value.startsWith('"')
        ) {
          try {
            inputs[key] = JSON.parse(value)
          } catch {
            // Keep as string if not valid JSON
          }
        }
      }
    }

    // Create args object
    const github = token ? getOctokit(token) : {} as any
    const args: WorkflowStepArgs = {
      github,
      context,
      core,
      $,
      fs,
      glob,
      io,
      fetch: globalThis.fetch,
      inputs,
    }

    // Execute the script
    const startTime = Date.now()
    try {
      const result = await script(args)
      const duration = Date.now() - startTime
      core.info(`✓ Completed ${step} in ${duration}ms`)

      // Return result if any
      if (result !== undefined) {
        core.setOutput('result', JSON.stringify(result))
      }
    } catch (error) {
      const duration = Date.now() - startTime
      core.error(`✗ Failed in workflow step: ${step} after ${duration}ms`)
      core.error(`Error: ${(error as Error).message}`)
      if ((error as Error).stack) {
        core.error(`Stack trace:\n${(error as Error).stack}`)
      }
      core.setFailed((error as Error).message)
      throw error
    }
  } catch (error) {
    core.setFailed((error as Error).message)
    process.exit(1)
  }
}

// Parse environment variables and run
core.info('Runner.ts started')
const step = process.env['STEP_PATH']
const inputsJson = process.env['STEP_INPUTS'] || '{}'

core.info(`STEP_PATH: ${step}`)
core.info(`STEP_INPUTS: ${inputsJson}`)

if (!step) {
  core.setFailed('STEP_PATH environment variable is required')
  process.exit(1)
}

try {
  const inputs = JSON.parse(inputsJson)
  await run({ step, inputs })
} catch (error) {
  core.setFailed(`Failed to parse inputs or run step: ${error}`)
  process.exit(1)
}

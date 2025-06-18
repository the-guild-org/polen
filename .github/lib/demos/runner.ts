#!/usr/bin/env node
/**
 * Unified runner for demo workflows
 * Simplifies workflow YAML by providing a single entry point
 */

import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { context } from '@actions/github'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import { WorkflowError } from '../../../src/lib/github-actions/error-handling.ts'

// Import all workflow step functions
import { addDemosLink, buildDemos, extractReleaseInfo } from './workflows/release.ts'

import { buildCurrentCycle, checkLatestTag, garbageCollect } from './workflows/update.ts'

import { generateDemoLinks, getPreviousDeployments, preparePrDeployment } from './workflows/preview.ts'

import { getDistTagInfo, updateDistTagContent } from './workflows/dist-tag.ts'

// Create workflow context
const createWorkflowContext = () => ({
  core,
  github: getOctokit(process.env['GITHUB_TOKEN'] || ''),
  context,
  $,
  fs,
})

/**
 * Available workflow steps
 */
const WORKFLOW_STEPS = {
  // Release workflow steps
  'extract-release-info': extractReleaseInfo,
  'build-demos': buildDemos,
  'add-demos-link': addDemosLink,

  // Update workflow steps
  'check-latest-tag': checkLatestTag,
  'build-current-cycle': buildCurrentCycle,
  'garbage-collect': garbageCollect,

  // Preview workflow steps
  'prepare-pr-deployment': preparePrDeployment,
  'generate-demo-links': generateDemoLinks,
  'get-previous-deployments': getPreviousDeployments,

  // Dist-tag workflow steps
  'get-dist-tag-info': getDistTagInfo,
  'update-dist-tag-content': updateDistTagContent,
} as const

type WorkflowStepName = keyof typeof WORKFLOW_STEPS

/**
 * Run a specific workflow step
 */
async function runWorkflowStep(stepName: WorkflowStepName, inputs: Record<string, any> = {}): Promise<void> {
  const step = WORKFLOW_STEPS[stepName]
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
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: node runner.ts <step-name> [inputs-json]')
    console.error('')
    console.error('Available steps:')
    Object.keys(WORKFLOW_STEPS).forEach(step => {
      console.error(`  - ${step}`)
    })
    process.exit(1)
  }

  const stepName = args[0] as WorkflowStepName
  const inputsJson = args[1] || '{}'

  if (!WORKFLOW_STEPS[stepName]) {
    console.error(`❌ Unknown workflow step: ${stepName}`)
    console.error('')
    console.error('Available steps:')
    Object.keys(WORKFLOW_STEPS).forEach(step => {
      console.error(`  - ${step}`)
    })
    process.exit(1)
  }

  try {
    const inputs = JSON.parse(inputsJson)
    await runWorkflowStep(stepName, inputs)
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

// Export for use in other scripts
export { runWorkflowStep, WORKFLOW_STEPS }

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

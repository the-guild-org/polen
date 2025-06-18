#!/usr/bin/env node
/**
 * CLI runner for workflow steps
 *
 * This provides a generic way to run workflow steps from the command line
 * by loading them from a specified module path.
 *
 * Usage: node step-runner-cli.ts <step-module-path> [inputs-json]
 */

import { runWorkflowStepFromPath } from './runner.ts'

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: node step-runner-cli.ts <step-module-path> [inputs-json]')
    console.error('')
    console.error('Examples:')
    console.error('  node step-runner-cli.ts ./steps/build.ts \'{"version": "1.2.3"}\'')
    console.error('  node step-runner-cli.ts ../workflow/deploy.ts')
    process.exit(1)
  }

  const stepModulePath = args[0]!
  const inputsJson = args[1]

  await runWorkflowStepFromPath(stepModulePath, inputsJson)
}

main()

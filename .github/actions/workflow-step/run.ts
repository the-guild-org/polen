#!/usr/bin/env node
import { runWorkflowStepFromPath } from '../../../src/lib/github-actions/index.ts'

// Get step name and inputs from command line
const stepName = process.argv[2]
const inputsJson = process.argv[3]

if (!stepName) {
  console.error('Usage: node run.ts <step-name> [inputs-json]')
  process.exit(1)
}

// Run the step from the conventional path
await runWorkflowStepFromPath(`../../steps/${stepName}.ts`, inputsJson)
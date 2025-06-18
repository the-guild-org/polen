#!/usr/bin/env node
/**
 * Project-specific step runner that follows our convention
 * of steps being in .github/steps/<name>.ts
 */

import { createStepRunnerCLI } from '../../../src/lib/github-actions/index.ts'

// Create and run the CLI with our project's conventions
const runCLI = createStepRunnerCLI({
  stepResolver: (stepName) => `../../steps/${stepName}.ts`,
  usage:
    'Usage: node run.ts <step-name> [inputs-json]\nThis runner expects steps to be in .github/steps/<step-name>.ts',
})

await runCLI()

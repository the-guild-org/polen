#!/usr/bin/env node

import { checkGlobalVsLocal } from '#lib/kit-temp'
import { Cli, Path } from '@wollybeard/kit'
import manifest from '../../package.json' with { type: 'json' }

// Handle --version flag
if (process.argv.includes(`--version`) || process.argv.includes(`-v`)) {
  console.log(manifest.version)
  process.exit(0)
}

// Check for global vs local Polen conflict
// The --allow-global flag is handled inside checkGlobalVsLocal
try {
  await checkGlobalVsLocal({
    packageName: 'polen',
    currentExecutablePath: process.argv[1] ?? '',
    errorMessageTemplate: {
      title: 'Global Polen detected in project with local Polen',
      explanation:
        'You are running the global Polen CLI in a project that has Polen installed locally. This can cause version mismatches, cache conflicts, and unexpected behavior.',
      solutions: [
        'pnpm exec polen <command>',
        'npx polen <command>',
        './node_modules/.bin/polen <command>',
      ],
    },
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

// Remove --allow-global from argv before dispatching to commands
// This prevents "Unknown flag" errors in individual commands
const filteredArgv = process.argv.filter(arg => arg !== '--allow-global')
process.argv = filteredArgv

const commandsDir = Path.join(import.meta.dirname, `commands`)
await Cli.dispatch(commandsDir)

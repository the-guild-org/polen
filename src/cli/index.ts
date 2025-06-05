#!/usr/bin/env node

import { Cli, Path } from '@wollybeard/kit'
import manifest from '../../package.json' with { type: 'json' }

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(manifest.version)
  process.exit(0)
}

const commandsDir = Path.join(import.meta.dirname, `commands`)
await Cli.dispatch(commandsDir)

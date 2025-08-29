#!/usr/bin/env node

import { checkGlobalVsLocal } from '#lib/kit-temp'
import { Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect } from 'effect'
import manifest from '../../package.json' with { type: 'json' }
import { allowGlobalParameter } from './_/parameters.js'

// Import all commands
import { build } from './commands/build.js'
import { cache } from './commands/cache.js'
import { config } from './commands/config.js'
import { create } from './commands/create.js'
import { dev } from './commands/dev.js'
import { open } from './commands/open.js'
import { staticCommand } from './commands/static.js'

// Define the main Polen command
const polenMain = Command.make(
  'polen',
  { allowGlobal: allowGlobalParameter },
  ({ allowGlobal }) => Console.log('Polen Effect CLI - Use --help to see available commands'),
)

// Combine all commands into the main CLI
const command = polenMain.pipe(
  Command.withSubcommands([
    dev,
    build,
    create,
    open,
    cache,
    config,
    staticCommand,
  ]),
)

// Set up and run the CLI application
const cli = Command.run(command, {
  name: 'Polen Effect CLI',
  version: manifest.version,
})

// Handle version flag manually since Effect CLI handles it differently
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(manifest.version)
  process.exit(0)
}

// Check for global vs local Polen conflict
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
  process.exit(1)
}

// Remove --allow-global from argv before dispatching to commands
// This prevents "Unknown flag" errors in individual commands
const filteredArgv = process.argv.filter(arg => arg !== '--allow-global')

NodeRuntime.runMain(
  cli(filteredArgv).pipe(
    Effect.provide(NodeContext.layer),
  ),
)

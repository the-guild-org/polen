#!/usr/bin/env node

import { Ef } from '#dep/effect'
import { Command, HelpDoc, Span } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { NodeFileSystem } from '@effect/platform-node'
import { PackageManager } from '@wollybeard/kit'
import { Console, Layer } from 'effect'
import manifest from '../../package.json' with { type: 'json' }
import { allowGlobalParameter } from './_/parameters.js'
import { build } from './commands/build.js'
import { cache } from './commands/cache.js'
import { config } from './commands/config.js'
import { create } from './commands/create.js'
import { dev } from './commands/dev.js'
import { heroImage } from './commands/hero-image.js'
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
    heroImage,
    staticCommand,
  ]),
)

// Export the CLI command for documentation generation
export const polenCli = command

// Create custom colorful summary
const summary = Span.spans([
  Span.error('POLEN 🌺'), // Red colored text
  Span.text(' '),
  Span.weak(`v${manifest.version}`),
  Span.text('\n'),
  Span.text('A framework for delightful GraphQL developer portals.'),
])

// Create custom footer with commands and links
const commandsList = HelpDoc.descriptionList([
  [Span.code('$ polen build'), HelpDoc.p('Build your documentation site')],
  [Span.code('$ polen cache'), HelpDoc.p('Manage the GraphQL schema cache')],
  [Span.code('$ polen config'), HelpDoc.p('Manage Polen configuration')],
  [Span.code('$ polen create'), HelpDoc.p('Create a new Polen project')],
  [Span.code('$ polen dev'), HelpDoc.p('Start the development server')],
  [Span.code('$ polen hero-image'), HelpDoc.p('Generate a hero image for your site')],
  [Span.code('$ polen open'), HelpDoc.p('Open your documentation site')],
  [Span.code('$ polen static'), HelpDoc.p('Serve the static build')],
])

// Format links like the non-Effect CLI with arrows
const learnMoreContent = HelpDoc.p(
  Span.spans([
    Span.text('Source Code  →  '),
    Span.uri('https://github.com/the-guild-org/polen'),
    Span.text('\n'),
    Span.text('Built By     →  '),
    Span.uri('https://the-guild.dev'),
    Span.text('\n'),
    Span.text('Ecosystem    →  '),
    Span.uri('https://graphql.org'),
  ]),
)

const footer = HelpDoc.blocks([
  HelpDoc.h2(Span.strong('COMMANDS')),
  commandsList,
  HelpDoc.empty,
  HelpDoc.p(
    Span.concat(
      Span.weak(`Get help for a command with `),
      Span.code('polen <command> --help'),
    ),
  ),
  HelpDoc.empty,
  HelpDoc.h2(Span.strong('LEARN MORE')),
  learnMoreContent,
])

// Set up and run the CLI application
const cli = Command.run(command, {
  name: 'Polen',
  version: manifest.version,
  summary,
  footer,
})

// Handle version flag manually since Effect CLI handles it differently
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(manifest.version)
  process.exit(0)
}

// Remove --allow-global from argv before dispatching to commands
// This prevents "Unknown flag" errors in individual commands
const filteredArgv = process.argv.filter(arg => arg !== '--allow-global')

// Create the main program with global vs local check
const program = Ef.gen(function*() {
  // Check for global vs local Polen conflict
  yield* PackageManager.checkGlobalVsLocal({
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

  // Run the CLI after the check passes
  return yield* cli(filteredArgv)
}).pipe(
  Ef.catchAll((error) => {
    console.error('[POLEN DEBUG] CLI error:', error)
    return Ef.die('CLI failed')
  }),
  Ef.provide(Layer.merge(NodeContext.layer, NodeFileSystem.layer)),
  Ef.scoped,
)

NodeRuntime.runMain(program)

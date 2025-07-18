#!/usr/bin/env node

import { Cli, Path } from '@wollybeard/kit'

// Remove the "static" argument before dispatching to subcommands
process.argv = process.argv.slice(0, 2).concat(process.argv.slice(3))

const commandsDir = Path.join(import.meta.dirname, `static`)
await Cli.dispatch(commandsDir)

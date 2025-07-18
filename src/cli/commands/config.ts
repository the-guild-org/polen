#!/usr/bin/env node

import { Cli, Path } from '@wollybeard/kit'

// Remove the "config" argument before dispatching to subcommands
process.argv = process.argv.slice(0, 2).concat(process.argv.slice(3))

const commandsDir = Path.join(import.meta.dirname, `config`)
await Cli.dispatch(commandsDir)

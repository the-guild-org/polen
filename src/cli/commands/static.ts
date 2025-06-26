#!/usr/bin/env node

import { Cli, Path } from '@wollybeard/kit'

const commandsDir = Path.join(import.meta.dirname, `static`)
await Cli.dispatch(commandsDir)

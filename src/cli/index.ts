#!/usr/bin/env node

import { Cli } from '#lib/cli/index.js'

await Cli.dispatch({
  commandsDir: import.meta.url,
})

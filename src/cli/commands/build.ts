#!/usr/bin/env node

import { Vite } from '#dep/vite/index.js'
import { loadConfig } from '../../api/load-config.js'

const config = await loadConfig({
  env: {
    command: `build`,
    mode: `production`,
  },
})

const builder = await Vite.createBuilder(config)

await builder.buildApp()

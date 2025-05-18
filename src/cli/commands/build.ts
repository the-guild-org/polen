#!/usr/bin/env node

import { Vite } from '#dep/vite/index.js'
import { Path } from '@wollybeard/kit'

const configFilePath = Path.ensureAbsoluteWithCWD(`polen.config.ts`)

const loadedConfig = await Vite.loadConfigFromFile(
  {
    command: `serve`,
    mode: `development`,
  },
  configFilePath,
  process.cwd(),
)

const builder = await Vite.createBuilder(loadedConfig?.config)
await builder.buildApp()

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

const viteDevServer = await Vite.createServer(
  loadedConfig?.config ?? {},
)

await viteDevServer.listen()

viteDevServer.printUrls()

console.log(`Polen development server is running`)

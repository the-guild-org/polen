#!/usr/bin/env node

import { Vite } from '#dep/vite/index.js'
import { Path } from '@wollybeard/kit'
import process from 'node:process'

// Get the actual directory where the command was invoked, not where the CLI script is located
const invokedDir = process.env[`INIT_CWD`] ?? process.cwd()
const configFilePath = Path.join(invokedDir, `polen.config.ts`)

const loadedConfig = await Vite.loadConfigFromFile(
  {
    command: `serve`,
    mode: `development`,
  },
  configFilePath,
  invokedDir,
)

const viteDevServer = await Vite.createServer(
  loadedConfig?.config ?? {},
)

await viteDevServer.listen()

viteDevServer.printUrls()

console.log(`Polen development server is running`)

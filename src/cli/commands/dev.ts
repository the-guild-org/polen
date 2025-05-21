#!/usr/bin/env node

import { Vite } from '#dep/vite/index.js'
import { loadConfig } from '../../api/load-config.js'

const config = await loadConfig({
  env: {
    command: `serve`,
    mode: `development`,
  },
})

const viteDevServer = await Vite.createServer(config)

await viteDevServer.listen()

viteDevServer.printUrls()

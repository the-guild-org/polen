#!/usr/bin/env node

import { Vite } from '#dep/vite/index.js'
import { Err } from '@wollybeard/kit'
import { loadConfig } from '../../api/load-config.js'

const config = await loadConfig({
  env: {
    command: `serve`,
    mode: `development`,
  },
})

const viteDevServer = await Err.tryCatch(() => Vite.createServer(config))

if (Err.is(viteDevServer)) {
  // Err.log(viteDevServer);
  process.exit(1)
}

await viteDevServer.listen()

viteDevServer.printUrls()

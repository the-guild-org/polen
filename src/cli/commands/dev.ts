/* eslint-disable */
// @ts-nocheck
import { Vite } from '#dep/vite/index.js'
import { Command } from '@molt/command'
import { Err } from '@wollybeard/kit'
import { z } from 'zod'
import { loadConfig } from '../../api/load-config.js'

const args = Command.create()
  .parameter(
    `--project -p`,
    // @ts-expect-error
    z.string().optional().describe(`The path to the project directory. Default is CWD (current working directory).`),
  )
  .settings({
    parameters: {
      environment: {
        $default: {
          // todo prfix seting doesn't seem to work with Molt!
          prefix: `POLEN_DEV_`,
          enabled: false,
        },
      },
    },
  })
  .parse()

const dir = args.project as string

const config = await loadConfig({
  env: {
    command: `serve`,
    mode: `development`,
  },
  dir,
  overrides: {
    root: dir,
  },
})

const viteDevServer = await Err.tryCatch(() => Vite.createServer(config))

if (Err.is(viteDevServer)) {
  // Err.log(viteDevServer)
  process.exit(1)
}

await viteDevServer.listen()

viteDevServer.printUrls()

// @ts-nocheck
import { Api } from '#api/index'
import { allowGlobalParameter, projectParameter } from '#cli/_/parameters'
import { Vite } from '#dep/vite/index'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { toViteUserConfig } from '#vite/config'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Command } from '@molt/command'
import { Err } from '@wollybeard/kit'
import { Effect } from 'effect'
import { z } from 'zod'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().optional())
  .parameter(
    `--project -p`,
    // @ts-expect-error
    projectParameter,
  )
  .parameter(
    `--base -b`,
    z.string().optional().describe('Base public path for deployment (e.g., /my-project/)'),
  )
  .parameter(
    `--port`,
    z.number().optional().describe('Port to run the development server on'),
  )
  .parameter(`--allow-global`, allowGlobalParameter)
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

const dir = ensureOptionalAbsoluteWithCwd(args.project)

if (!await Api.Project.validateProjectDirectory(dir)) {
  process.exit(1)
}

const polenConfig = await Effect.runPromise(
  Api.ConfigResolver.fromFile({
    dir,
    overrides: {
      build: {
        base: args.base,
      },
      server: {
        port: args.port,
      },
      advanced: {
        debug: args.debug,
      },
    },
  }).pipe(
    Effect.provide(NodeFileSystem.layer),
  ),
)

const viteUserConfig = toViteUserConfig(polenConfig)

const viteDevServer = await Err.tryCatch(() => Vite.createServer(viteUserConfig))

if (Err.is(viteDevServer)) {
  Err.log(viteDevServer)
  process.exit(1)
}

await viteDevServer.listen()

viteDevServer.printUrls()

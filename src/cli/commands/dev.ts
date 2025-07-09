// @ts-nocheck
import { Api } from '#api/index'
import { Vite } from '#dep/vite/index'
import { ensureOptionalAbsolute, ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command } from '@molt/command'
import { Err, Path } from '@wollybeard/kit'
import { z } from 'zod'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().optional())
  .parameter(
    `--project -p`,
    // @ts-expect-error
    z.string().optional().describe(`The path to the project directory. Default is CWD (current working directory).`),
  )
  .parameter(
    `--base -b`,
    z.string().optional().describe('Base public path for deployment (e.g., /my-project/)'),
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

const dir = ensureOptionalAbsoluteWithCwd(args.project) as string

const viteUserConfig = await Api.ConfigResolver.fromFile({
  dir,
  overrides: {
    ...(args.base ? { build: { base: args.base } } : {}),
    advanced: {
      debug: args.debug,
    },
  },
})

const viteDevServer = await Err.tryCatch(() => Vite.createServer(viteUserConfig))

if (Err.is(viteDevServer)) {
  Err.log(viteDevServer)
  process.exit(1)
}

await viteDevServer.listen()

viteDevServer.printUrls()

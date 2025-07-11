// @ts-nocheck
import { Api } from '#api/index'
import { projectParameter } from '#cli/_/parameters'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command } from '@molt/command'
import { z } from 'zod'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
  .parameter(
    `--project -p`,
    projectParameter,
  )
  .parameter(
    `--architecture -a`,
    Api.Config.BuildArchitecture.default('ssg').describe('Which kind of application architecture to output.'),
  )
  .parameter(
    `--base -b`,
    z.string().optional().describe('Base public path for deployment (e.g., /my-project/)'),
  )
  .parameter(
    `--port`,
    z.number().optional().describe('Default port for the SSR application'),
  )
  .settings({
    parameters: {
      environment: {
        $default: {
          // todo prfix seting doesn't seem to work with Molt!
          prefix: `POLEN_CREATE_`,
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

await Api.Builder.build({
  dir,
  architecture: args.architecture,
  base: args.base,
  server: {
    port: args.port,
  },
  advanced: {
    debug: args.debug,
  },
})

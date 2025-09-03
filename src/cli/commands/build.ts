// @ts-nocheck
import { Api } from '#api/$'
import { allowGlobalParameter, projectParameter } from '#cli/_/parameters'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Command } from '@molt/command'
import { Effect } from 'effect'
import { z } from 'zod'

// todo remove these inline defs once using effect cli instead of molt
export const BuildArchitectureEnum = {
  ssg: `ssg`,
  spa: `spa`,
  ssr: `ssr`,
} as const

export const BuildArchitecture = z.nativeEnum(BuildArchitectureEnum)

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
  .parameter(
    `--project -p`,
    projectParameter,
  )
  .parameter(
    `--architecture -a`,
    BuildArchitecture.default('ssg').describe('Which kind of application architecture to output.'),
  )
  .parameter(
    `--base -b`,
    z.string().optional().describe('Base public path for deployment (e.g., /my-project/)'),
  )
  .parameter(
    `--port`,
    z.number().optional().describe('Default port for the SSR application'),
  )
  .parameter(`--allow-global`, allowGlobalParameter)
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

await Effect.runPromise(
  Api.Builder.build({
    dir,
    overrides: {
      build: {
        architecture: args.architecture,
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

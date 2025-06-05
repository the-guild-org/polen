/* eslint-disable */
// @ts-nocheck
import { Api } from '#api/index.js'
import { Vite } from '#dep/vite/index.js'
import { Command } from '@molt/command'
import { z } from 'zod'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
  .parameter(
    `--architecture -a`,
    Api.Config.BuildArchitecture.default('ssg').describe('Which kind of application architecture to output.'),
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

// HACK:
// todo
// we don't want to  lose pretty preting of defaults in Molt but
// we don't want cli defaults to override explicit inputs in the config file either
// we need something like setset and/or an ability in molt to show a default but then have undefined internally etc.
// and now if user passes --no-debug/ --debug false it has no effect which is wrong since its not via default anymore, ... ugh
await Api.Builder.build({
  ...(args.debug === false ? {} : { debug: args.debug }),
  ...(args.architecture === 'ssg' ? {} : { architecture: args.architecture }),
})

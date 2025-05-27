// eslint-disable-next-line
// @ts-nocheck
import { Vite } from '#dep/vite/index.js'
import { Command } from '@molt/command'
import { z } from 'zod'
import { loadConfig } from '../../api/load-config.js'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
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

const config = await loadConfig({
  env: {
    command: `build`,
    mode: `production`,
  },
  overrides: {
    advanced: {
      debug: args.debug,
    },
  },
})

const builder = await Vite.createBuilder(config)

await builder.buildApp()

/* eslint-disable */
// @ts-nocheck
import { build } from '#api/build/build.js'
import { Configurator } from '#api/configurator/index.js'
import { Vite } from '#dep/vite/index.js'
import { Command } from '@molt/command'
import { z } from 'zod'
import { loadConfig } from '../../api/load-config.js'

const args = Command.create()
  .parameter(`--debug -d`, z.boolean().default(false))
  .parameter(
    `--mode -m`,
    z.enum(Configurator.BuildMode).default('ssg').describe('Which kind of application architecture to outut.'),
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

await build({
  ...args,
})

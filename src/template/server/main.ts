import { serve } from '@hono/node-server' // TODO: support non-node platforms.
import { neverCase } from '@wollybeard/kit/language'
import { createApp } from './app.js'
import { generate } from './ssg/generate.js'
import { view } from './view.js'

if (__BUILDING__) {
  switch (__BUILD_ARCHITECTURE__) {
    case `ssg`:
      await generate(view)
      break
    case `ssr`:
      const port = process.env[`PORT`] ? parseInt(process.env[`PORT`]) : 3001 // todo viteConfigResolved.server.port + 1
      const app = createApp()
      serve({ fetch: app.fetch, port })
      break
    case `spa`:
      throw new Error(`Sorry, SPA build type not supported`)
    default:
      neverCase(__BUILD_ARCHITECTURE__)
  }
}

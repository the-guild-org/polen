import { serve } from '@hono/node-server' // TODO: support non-node platforms.
import { Path } from '@wollybeard/kit'
import { Match } from 'effect'
import { templateConfig } from 'virtual:polen/project/config'
import { createApp } from './app.js'

if (__BUILDING__) {
  switch (__BUILD_ARCHITECTURE__) {
    case `ssg`:
    case `ssr`:
      const port = process.env[`PORT`] ? parseInt(process.env[`PORT`]) : templateConfig.server.port
      const app = createApp({
        paths: {
          assets: {
            directory: Path.join(
              templateConfig.paths.project.relative.build.root,
              templateConfig.paths.project.relative.build.relative.assets.root,
            ),
            route: templateConfig.server.routes.assets,
          },
          base: templateConfig.build.base,
        },
      })
      serve({ fetch: app.fetch, port })
      break
    case `spa`:
      throw new Error(`SPA build type not yet supported.`)
    default:
      Match.value(__BUILD_ARCHITECTURE__).pipe(Match.exhaustive)
  }
}

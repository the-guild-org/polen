import { serve } from '@hono/node-server' // TODO: support non-node platforms.
import { Path } from '@wollybeard/kit'
import { neverCase } from '@wollybeard/kit/language'
import PROJECT_DATA from 'virtual:polen/project/data.json'
import { createApp } from './app.js'

if (__BUILDING__) {
  switch (__BUILD_ARCHITECTURE__) {
    case `ssg`:
    case `ssr`:
      const port = process.env[`PORT`] ? parseInt(process.env[`PORT`]) : PROJECT_DATA.server.port
      const app = createApp({
        paths: {
          assets: {
            directory: Path.join(
              PROJECT_DATA.paths.project.relative.build.root,
              PROJECT_DATA.paths.project.relative.build.relative.assets.root,
            ),
            route: PROJECT_DATA.server.routes.assets,
          },
          base: PROJECT_DATA.basePath,
        },
      })
      serve({ fetch: app.fetch, port })
      break
    case `spa`:
      throw new Error(`Sorry, SPA build type not supported`)
    default:
      neverCase(__BUILD_ARCHITECTURE__)
  }
}

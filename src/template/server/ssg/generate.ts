import { Hono } from '#dep/hono/index.js'
import type { ReactRouter } from '#dep/react-router/index.js'
import { app } from '#template/server/app.js'
import consola from 'consola'
import * as NodeFs from 'node:fs/promises'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { renderPage } from '../render-page.jsx'
import { getRoutesPaths } from './get-route-paths.js'

export const generate = async (view: ReactRouter.StaticHandler) => {
  const handler: Hono.Handler = async (ctx) => {
    const staticHandlerContext = await view.query(ctx.req.raw)
    if (staticHandlerContext instanceof Response) {
      return staticHandlerContext
    }
    return renderPage(staticHandlerContext)
  }

  const routePaths = getRoutesPaths()

  for (const routePath of routePaths) {
    app.get(routePath, handler)
  }

  consola.info(`Generating static site...`)

  const result = await Hono.SSG.toSSG(app, NodeFs, {
    concurrency: 10,
    dir: PROJECT_DATA.paths.relative.build.root,
  })

  if (!result.success) {
    consola.error(`Failed to generate static site`)
    console.log(result)
  }

  consola.success(`Done`)
  consola.info(`try it: npx serve ${PROJECT_DATA.paths.relative.build.root} -p 4000`)
}

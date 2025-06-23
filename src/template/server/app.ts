import { Hono } from '#dep/hono/index'
import { AppleTouchIcon } from '#lib/apple-touch-icon/index'
import { Favicon } from '#lib/favicon/index'
import { serveStatic } from '@hono/node-server/serve-static'
import { Http } from '@wollybeard/kit'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { renderPage } from './render-page.tsx'
import { view } from './view.ts'

export const app = new Hono.Hono()

if (__BUILDING__) {
  app.use(
    PROJECT_DATA.server.static.route,
    serveStatic({ root: PROJECT_DATA.server.static.directory }),
  )
}

app.all(`*`, async (ctx) => {
  const staticHandlerContext = await view.query(ctx.req.raw)

  if (staticHandlerContext instanceof Response) {
    return staticHandlerContext
  }

  if (Favicon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  if (AppleTouchIcon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  return renderPage(staticHandlerContext)
})

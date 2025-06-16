import { Hono } from '#dep/hono/index'
import { AppleTouchIcon } from '#lib/apple-touch-icon/index'
import { Favicon } from '#lib/favicon/index'
import { serveStatic } from '@hono/node-server/serve-static'
import { Http } from '@wollybeard/kit'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { renderPage } from './render-page.jsx'
import { view } from './view.ts'

export const app = new Hono.Hono()

if (__BUILDING__) {
  app.use(
    PROJECT_DATA.server.static.route,
    serveStatic({ root: PROJECT_DATA.server.static.directory }),
  )
}

app.all(`*`, async (ctx) => {
  console.log(`[Polen Debug] Request:`, ctx.req.method, ctx.req.path)
  console.log(`[Polen Debug] Request URL:`, ctx.req.url)
  console.log(`[Polen Debug] Headers:`, ctx.req.header())
  console.log(`[Polen Debug] PROJECT_DATA.basePath:`, PROJECT_DATA.basePath)

  const staticHandlerContext = await view.query(ctx.req.raw)

  console.log(`[Polen Debug] Static handler response:`, staticHandlerContext)
  console.log(`[Polen Debug] Response is instance of Response:`, staticHandlerContext instanceof Response)

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

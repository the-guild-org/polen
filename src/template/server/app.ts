import { Hono } from '#dep/hono/index.js'
// import { Hono } from '../../dep/hono/index.ts'

import { AppleTouchIcon } from '#lib/apple-touch-icon/index.js'
import { Favicon } from '#lib/favicon/index.js'
import { serveStatic } from '@hono/node-server/serve-static'
import { Fs, Http, Path } from '@wollybeard/kit'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { renderPage } from './render-page.jsx'
import { view } from './view.ts'

export const app = new Hono.Hono()

if (__BUILDING__) {
  app.use(
    PROJECT_DATA.server.static.route,
    serveStatic({ root: PROJECT_DATA.server.static.directory }),
  )
}

app.get(`*`, async (ctx) => {
  const staticHandlerContext = await view.query(ctx.req.raw)

  if (staticHandlerContext instanceof Response) {
    return staticHandlerContext
  }

  if (
    ctx.req.path.includes(PROJECT_DATA.faviconPath)
    || ctx.req.path.includes(PROJECT_DATA.faviconPath.replace(`.svg`, `.ico`))
  ) {
    const path = ctx.req.path === PROJECT_DATA.faviconPath
      ? PROJECT_DATA.faviconPath
      : PROJECT_DATA.faviconPath.replace(`.svg`, `.ico`)
    const faviconPath = Path.join(import.meta.dirname, `../../assets`, path)
    const favicon = await Fs.read(faviconPath)
    return new Response(favicon, {
      headers: [
        Http.Headers.contentType(
          path.endsWith(`.ico`) ? `image/x-icon` : `image/svg+xml`,
        ),
        Http.Headers.responseCacheControl({
          visibility: `public`,
          maxAge: 31536000,
          immutable: true,
        }),
      ],
    })
  }

  if (Favicon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  if (AppleTouchIcon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  return renderPage(staticHandlerContext)
})

import { ReactDomServer } from '#dep/react-dom-server/index.js'
import type { Vite } from '#dep/vite/index.js'
import { AppleTouchIcon } from '#lib/apple-touch-icon/index.js'
import { Favicon } from '#lib/favicon/index.js'
import { Http } from '@wollybeard/kit'
import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { StrictMode } from 'react'
import type { StaticHandlerContext } from 'react-router'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { routes } from './routes.jsx'

const getRouteHeaders = (context: StaticHandlerContext): Headers => {
  const leaf = context.matches[context.matches.length - 1]
  if (!leaf) return new Headers()

  const actionHeaders = context.actionHeaders[leaf.route.id]
  const loaderHeaders = context.loaderHeaders[leaf.route.id]
  const headers = new Headers(actionHeaders)
  if (loaderHeaders) {
    for (const [key, value] of loaderHeaders.entries()) {
      headers.append(key, value)
    }
  }
  return headers
}

const getAssetHtmlTags = (manifest: Vite.Manifest): { css: string[]; js: string[] } => {
  // TODO: We could inline this into the generated server.
  // TODO: this only applies in production
  // Insert links to assets
  const css: string[] = []
  const js: string[] = []
  for (const manifestChunk of Object.values(manifest)) {
    if (manifestChunk.isEntry) {
      js.push(`<script type="module" src="/${manifestChunk.file}"></script>`)
    }
    for (const cssItem of manifestChunk.css ?? []) {
      css.push(`<link rel="stylesheet" href="/${cssItem}">`)
    }
  }

  return {
    css,
    js,
  }
}

const injectAssetHtmlTags = (html: string, htmlTags: { css: string[]; js: string[] }): string => {
  if (htmlTags.css.length > 0) {
    html = html.replace(`</head>`, `${htmlTags.css.join(``)}</head>`)
  }
  if (htmlTags.js.length > 0) {
    html = html.replace(`</body>`, `${htmlTags.js.join(``)}</body>`)
  }
  return html
}

const app = new Hono()

const staticHandler = createStaticHandler(routes)

app.get(`*`, async ctx => {
  const staticHandlerContext = await staticHandler.query(ctx.req.raw)

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
    const faviconPath = join(import.meta.dirname, `../../assets`, path)
    const favicon = await readFile(faviconPath)
    return new Response(favicon, {
      headers: [
        Http.Headers.contentType(path.endsWith(`.ico`) ? `image/x-icon` : `image/svg+xml`),
        Http.Headers.responseCacheControl({ visibility: `public`, maxAge: 31536000, immutable: true }),
      ],
    })
  }

  if (Favicon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  if (AppleTouchIcon.fileNamePattern.test(ctx.req.path)) {
    return Http.Response.notFound
  }

  const router = createStaticRouter(staticHandler.dataRoutes, staticHandlerContext)

  let html = ``

  try {
    html = ReactDomServer.renderToString(
      (
        <StrictMode>
          <StaticRouterProvider
            router={router}
            context={staticHandlerContext}
          />
        </StrictMode>
      ),
    )
  } catch (cause) {
    throw new Error(`Failed to server side render the HTML`, { cause })
  }

  if (import.meta.env.PROD) {
    const htmlTags = getAssetHtmlTags(viteClientAssetManifest)
    html = injectAssetHtmlTags(html, htmlTags)
  }

  if (import.meta.env.DEV) {
    // const env = ctx.env as { viteDevServer: Vite.ViteDevServer }
    // html = await env.viteDevServer.transformIndexHtml(ctx.req.url, html)
    // await env.viteDevServer.transformIndexHtml(ctx.req.url, html)
  }

  const headers = getRouteHeaders(staticHandlerContext)
  headers.set(`Content-Type`, `text/html; charset=utf-8`)

  return new Response(`<!DOCTYPE html>${html}`, {
    status: staticHandlerContext.statusCode,
    headers,
  })
})

export default app

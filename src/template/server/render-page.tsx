import type { ReactRouter } from '#dep/react-router/index.ts'
import type { ReactRouterAid } from '#lib/react-router-aid/index.ts'
import { Arr } from '@wollybeard/kit'
import { StrictMode } from 'react'
import * as ReactDomServer from 'react-dom/server'
import { createStaticRouter, StaticRouterProvider } from 'react-router'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { injectManifestIntoHtml } from './manifest.ts'
import { view } from './view.ts'

export const renderPage = (
  staticHandlerContext: ReactRouter.StaticHandlerContext,
) => {
  const router = createStaticRouter(view.dataRoutes, staticHandlerContext)

  let html = ``

  try {
    html = ReactDomServer.renderToString(
      <StrictMode>
        <StaticRouterProvider router={router} context={staticHandlerContext} />
      </StrictMode>,
    )
  } catch (cause) {
    throw new Error(`Failed to server side render the HTML`, { cause })
  }

  if (__BUILDING__) {
    html = injectManifestIntoHtml(html, viteClientAssetManifest)
  }

  // todo: what is this?
  if (import.meta.env.DEV) {
    // const env = ctx.env as { viteDevServer: Vite.ViteDevServer }
    // html = await env.viteDevServer.transformIndexHtml(ctx.req.url, html)
    // await env.viteDevServer.transformIndexHtml(ctx.req.url, html)
  }

  const headers = getRouteHeaders(staticHandlerContext)
  headers.set(`Content-Type`, `text/html; charset=utf-8`)

  // Check for custom status code in route handle
  const statusCode = getStatusCode(staticHandlerContext)

  return new Response(`<!DOCTYPE html>${html}`, {
    status: statusCode,
    headers,
  })
}

const getStatusCode = (
  context: ReactRouter.StaticHandlerContext,
): number => {
  // First check if React Router set a status code
  if (context.statusCode && context.statusCode !== 200) {
    return context.statusCode
  }

  // Then check for custom status in route handle
  const handle = Arr.getLast(context.matches)?.route.handle as undefined | ReactRouterAid.RouteHandle
  if (handle?.statusCode) {
    return handle.statusCode
  }

  return 200
}

const getRouteHeaders = (
  context: ReactRouter.StaticHandlerContext,
): Headers => {
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

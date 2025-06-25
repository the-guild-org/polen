import { reportError } from '#api/server/report-error'
import type { ReactRouter } from '#dep/react-router/index'
import { React } from '#dep/react/index'
import { ResponseInternalServerError } from '#lib/kit-temp'
import type { ReactRouterAid } from '#lib/react-router-aid/index'
import { Arr } from '@wollybeard/kit'
import * as ReactDomServer from 'react-dom/server'
import { createStaticRouter, StaticRouterProvider } from 'react-router'
import { view } from './view.ts'

interface RenderHooks {
  transformHtml?: (html: string) => Promise<string> | string
}

export const createPageHtmlResponse = async (
  staticHandlerContext: ReactRouter.StaticHandlerContext,
  hooks?: RenderHooks,
) => {
  const router = createStaticRouter(view.dataRoutes, staticHandlerContext)

  let html = ``

  try {
    html = ReactDomServer.renderToString(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(StaticRouterProvider, {
          router,
          context: staticHandlerContext,
        }),
      ),
    )
  } catch (cause) {
    reportError(new Error(`Failed to server side render the HTML`, { cause }))
    return ResponseInternalServerError()
  }

  // Create the full HTML document

  // Apply HTML transformation hook to the full document
  if (hooks?.transformHtml) {
    html = await hooks.transformHtml(html)
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

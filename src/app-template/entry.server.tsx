import { Hono } from 'hono'
import type { StaticHandlerContext } from 'react-router'
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router'
import { routes } from './routes.jsx'
import { ReactDomServer } from '../lib/react-dom-server/_namespace.js'
import { StrictMode } from 'react'
import { debug } from '../lib/debug/_exports.js'

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

const app = new Hono()

const staticHandler = createStaticHandler(routes)

app.get(`*`, async ctx => {
  const staticHandlerContext = await staticHandler.query(ctx.req.raw)
  // console.log(staticHandlerContext)

  if (staticHandlerContext instanceof Response) {
    return staticHandlerContext
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

  if (import.meta.env.DEV) {
    debug(`transformIndexHtml`)
    // @see https://github.com/honojs/vite-plugins/issues/141
    html = transformIndexHtml(html)
  }

  const headers = getRouteHeaders(staticHandlerContext)
  headers.set(`Content-Type`, `text/html; charset=utf-8`)

  return new Response(`<!DOCTYPE html>${html}`, {
    status: staticHandlerContext.statusCode,
    headers,
  })
  // return ctx.text(`Hello Vite!`)
})

const transformIndexHtml = (html: string): string => {
  const REACT_FAST_REFRESH_PREAMBLE = `import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`

  const scripts = `` +
    `<script type="module" src="/@vite/client"></script>` +
    `<script type="module" async>${REACT_FAST_REFRESH_PREAMBLE}</script>`
  html = html.replace(`</body>`, `${scripts}</body>`)

  return html
}

export default app

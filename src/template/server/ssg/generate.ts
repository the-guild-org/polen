import { Hono } from '#dep/hono/index'
import type { ReactRouter } from '#dep/react-router/index'
import { app } from '#template/server/app'
import * as NodeFs from 'node:fs/promises'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { renderPage } from '../render-page.jsx'
import { getRoutesPaths } from './get-route-paths.ts'

export const generate = async (view: ReactRouter.StaticHandler) => {
  const handler: Hono.Handler = async (ctx) => {
    // For SSG, we need to create a request with the base path prepended
    // so React Router can match it correctly
    const url = new URL(ctx.req.raw.url)
    const basePath = PROJECT_DATA.basePath === '/' ? '' : PROJECT_DATA.basePath.slice(0, -1)
    
    // Create a new request with the base path prepended to the pathname
    const modifiedRequest = new Request(
      `${url.protocol}//${url.host}${basePath}${url.pathname}${url.search}`,
      {
        method: ctx.req.raw.method,
        headers: ctx.req.raw.headers,
        body: ctx.req.raw.body,
      }
    )

    const staticHandlerContext = await view.query(modifiedRequest)
    if (staticHandlerContext instanceof Response) {
      return staticHandlerContext
    }
    return renderPage(staticHandlerContext)
  }

  const routePaths = getRoutesPaths()

  for (const routePath of routePaths) {
    app.get(routePath, handler)
  }

  // For large schemas, we need to process in smaller batches to avoid memory issues
  const BATCH_SIZE = 50
  const totalPaths = routePaths.length
  console.log(`[info] Generating ${totalPaths} static pages...`)

  for (let i = 0; i < totalPaths; i += BATCH_SIZE) {
    const batchPaths = routePaths.slice(i, i + BATCH_SIZE)
    const batchApp = new Hono.Hono()

    // Create a custom handler for batch processing that includes base path handling
    const batchHandler: Hono.Handler = async (ctx) => {
      // For SSG, we need to create a request with the base path prepended
      const url = new URL(ctx.req.raw.url)
      const basePath = PROJECT_DATA.basePath === '/' ? '' : PROJECT_DATA.basePath.slice(0, -1)
      
      // Create a new request with the base path prepended to the pathname
      const modifiedRequest = new Request(
        `${url.protocol}//${url.host}${basePath}${url.pathname}${url.search}`,
        {
          method: ctx.req.raw.method,
          headers: ctx.req.raw.headers,
          body: ctx.req.raw.body,
        }
      )

      const staticHandlerContext = await view.query(modifiedRequest)
      if (staticHandlerContext instanceof Response) {
        return staticHandlerContext
      }
      return renderPage(staticHandlerContext)
    }

    // Register only the routes for this batch
    for (const routePath of batchPaths) {
      batchApp.get(routePath, batchHandler)
    }

    console.log(
      `[info] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${
        Math.ceil(totalPaths / BATCH_SIZE)
      } (${batchPaths.length} pages)...`,
    )

    const result = await Hono.SSG.toSSG(batchApp, NodeFs, {
      concurrency: 5, // Reduced concurrency for memory efficiency
      dir: PROJECT_DATA.paths.relative.build.root,
    })

    if (!result.success) {
      throw new Error(`Failed to generate static site at batch ${Math.floor(i / BATCH_SIZE) + 1}`, {
        cause: result.error,
      })
    }
  }

  console.log(`[info] Successfully generated ${totalPaths} static pages.`)
}

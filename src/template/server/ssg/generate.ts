import { Hono } from '#dep/hono/index'
import type { ReactRouter } from '#dep/react-router/index'
import { asyncParallel, chunk } from '#lib/kit-temp'
import { debugPolen } from '#singletons/debug'
import * as NodeFs from 'node:fs/promises'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { createPageHtmlResponse } from '../create-page-html-response.tsx'
import { injectManifestIntoHtml } from '../manifest.ts'
import { createPolenDataInjector } from '../transformers/inject-polen-data.ts'
import { createThemeInitInjector } from '../transformers/inject-theme-init.ts'
import { getRoutesPaths } from './get-route-paths.ts'

export const generate = async (view: ReactRouter.StaticHandler) => {
  const debug = debugPolen.sub(`ssg`)

  const routePaths = getRoutesPaths()
  const totalPaths = routePaths.length
  debug(`start`, { totalPaths })

  // Process routes in batches using the new utilities
  const batchSize = 50
  const batches = chunk(routePaths, batchSize)

  const result = await asyncParallel(
    batches,
    async (batchPaths, batchIndex) => {
      const batchApp = new Hono.Hono()

      // Create a custom handler for batch processing that includes base path handling
      const batchHandler: Hono.Handler = async (ctx) => {
        // For SSG, we need to create a request with the base path prepended
        const url = new URL(ctx.req.raw.url)
        const basePath = PROJECT_DATA.basePath === `/` ? `` : PROJECT_DATA.basePath.slice(0, -1)

        // Create a new request with the base path prepended to the pathname
        const modifiedRequest = new Request(
          `${url.protocol}//${url.host}${basePath}${url.pathname}${url.search}`,
          {
            method: ctx.req.raw.method,
            headers: ctx.req.raw.headers,
            body: ctx.req.raw.body,
          },
        )

        const staticHandlerContext = await view.query(modifiedRequest)
        if (staticHandlerContext instanceof Response) {
          return staticHandlerContext
        }

        // SSG needs Polen data injection, theme init, and manifest transformation
        const polenDataInjector = createPolenDataInjector()
        const themeInitInjector = createThemeInitInjector()
        const transformHtml = async (html: string) => {
          // First inject Polen data
          html = await polenDataInjector(html, ctx)
          // Then inject theme initialization
          html = await themeInitInjector(html, ctx)
          // Finally inject manifest
          return injectManifestIntoHtml(html, viteClientAssetManifest, PROJECT_DATA.basePath)
        }
        // Pass ctx for SSG to set up Polen data
        return createPageHtmlResponse(staticHandlerContext, { transformHtml }, ctx)
      }

      // Register only the routes for this batch
      for (const routePath of batchPaths) {
        batchApp.get(routePath, batchHandler)
      }

      debug(`batch:start`, {
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        pagesInBatch: batchPaths.length,
      })

      const ssgResult = await Hono.SSG.toSSG(batchApp, NodeFs, {
        concurrency: 5, // Reduced concurrency for memory efficiency
        dir: PROJECT_DATA.paths.relative.build.root,
      })

      if (!ssgResult.success) {
        throw new Error(`Failed to generate static site at batch ${batchIndex + 1}`, {
          cause: ssgResult.error,
        })
      }

      return ssgResult
    },
    {
      concurrency: 1, // Process batches sequentially to avoid memory issues
      failFast: true, // Stop on first batch failure
    },
  )

  if (!result.success) {
    throw new Error(`SSG generation failed`, { cause: result.errors[0] })
  }

  debug(`complete`, { totalPaths })
}

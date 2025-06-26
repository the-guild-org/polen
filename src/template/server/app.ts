import { Hono } from '#dep/hono/index'
import { createHtmlTransformer, type HtmlTransformer } from '#lib/html-utils/html-transformer'
import { serveStatic } from '@hono/node-server/serve-static'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { injectManifestIntoHtml } from './manifest.ts'
import { PageMiddleware } from './middleware/page.ts'
import { UnsupportedAssetsMiddleware } from './middleware/unsupported-assets.ts'
import { createPolenDataInjector } from './transformers/inject-polen-data.ts'
import { createThemeInitInjector } from './transformers/inject-theme-init.ts'

export interface AppHooks {
  transformHtml?: HtmlTransformer[]
}

export interface AppOptions {
  hooks?: AppHooks
}

export const createApp = (options: AppOptions = {}) => {
  const app = new Hono.Hono()

  // Collect all HTML transformers
  const htmlTransformers: HtmlTransformer[] = [
    // Always inject Polen global data (both dev and prod)
    createPolenDataInjector(),
    // Theme initialization must come after Polen data
    createThemeInitInjector(),
    ...(options.hooks?.transformHtml || []),
  ]

  // Core middleware
  app.use(`*`, UnsupportedAssetsMiddleware())

  // Production-specific setup
  if (__BUILDING__) {
    // Add manifest transformer
    htmlTransformers.push(createHtmlTransformer((html, ___ctx) => {
      return injectManifestIntoHtml(html, viteClientAssetManifest, PROJECT_DATA.basePath)
    }))

    // Static file serving
    app.use(
      PROJECT_DATA.server.static.route,
      serveStatic({ root: PROJECT_DATA.server.static.directory }),
    )
  }

  app.all(`*`, PageMiddleware(htmlTransformers))

  return app
}

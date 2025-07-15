import { Hono } from '#dep/hono/index'
import { createHtmlTransformer, type HtmlTransformer } from '#lib/html-utils/html-transformer'
import { serveStatic } from '@hono/node-server/serve-static'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { injectManifestIntoHtml } from './manifest.js'
import { PageMiddleware } from './middleware/page.js'
import { UnsupportedAssetsMiddleware } from './middleware/unsupported-assets.js'
import { createPolenDataInjector } from './transformers/inject-polen-data.js'
import { createThemeInitInjector } from './transformers/inject-theme-init.js'

export type App = Hono.Hono

export interface AppHooks {
  transformHtml?: HtmlTransformer[]
}

export interface AppOptions {
  hooks?: AppHooks
  paths: {
    base: string
    assets: {
      directory: string
      route: string
    }
  }
}

export const createApp = (options: AppOptions) => {
  const app = new Hono.Hono().basePath(options.paths.base)

  // Collect all HTML transformers
  const htmlTransformers: HtmlTransformer[] = [
    // Always inject Polen global data (both dev and prod)
    createPolenDataInjector(),
    // Theme initialization must come after Polen data
    createThemeInitInjector(),
    ...(options.hooks?.transformHtml || []),
  ]

  // Static file serving
  app.use(`*`, UnsupportedAssetsMiddleware())
  app.use(
    `${options.paths.assets.route}/*`,
    serveStatic({ root: options.paths.assets.directory }),
  )

  if (__BUILDING__) {
    // Add manifest transformer
    htmlTransformers.push(createHtmlTransformer((html, ___ctx) => {
      return injectManifestIntoHtml(html, viteClientAssetManifest, options.paths.base)
    }))
  }

  app.all(`*`, PageMiddleware(htmlTransformers))

  return app
}

import { Hono } from '#dep/hono/index'
import { serveStatic } from '@hono/node-server/serve-static'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import viteClientAssetManifest from 'virtual:polen/vite/client/manifest'
import { injectManifestIntoHtml } from './manifest.ts'
import { PageMiddleware } from './middleware/page.ts'
import { UnsupportedAssetsMiddleware } from './middleware/unsupported-assets.ts'

export type HtmlTransformer = (html: string, ctx: Hono.Context) => Promise<string> | string

export interface AppHooks {
  transformHtml?: HtmlTransformer[]
}

export interface AppOptions {
  hooks?: AppHooks
}

export const createApp = (options: AppOptions = {}) => {
  const app = new Hono.Hono()

  // Collect all HTML transformers
  const htmlTransformers: HtmlTransformer[] = [...(options.hooks?.transformHtml || [])]

  // Core middleware
  app.use('*', UnsupportedAssetsMiddleware())

  // Production-specific setup
  if (__BUILDING__) {
    // Add manifest transformer
    htmlTransformers.push((html, _ctx) => {
      return injectManifestIntoHtml(html, viteClientAssetManifest, PROJECT_DATA.basePath)
    })

    // Static file serving
    app.use(
      PROJECT_DATA.server.static.route,
      serveStatic({ root: PROJECT_DATA.server.static.directory }),
    )
  }

  app.all('*', PageMiddleware(htmlTransformers))

  return app
}

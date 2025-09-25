import { Ef } from '#dep/effect'
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
      /**
       * Directory path for serving static assets.
       * MUST be a relative path from process.cwd() due to @hono/node-server constraints.
       * Absolute paths are NOT supported by the serveStatic middleware.
       *
       * @example './node_modules/.vite/polen-assets'
       * @example '../../../polen/node_modules/.vite/polen-assets'
       * @example './dist/assets'
       */
      directory: string
      /**
       * URL route prefix for serving assets
       * @example '/assets'
       */
      route: string
    }
  }
}

export const createApp = (options: AppOptions) => {
  const app = new Hono.Hono().basePath(options.paths.base)

  // Static file serving
  app.use(`*`, UnsupportedAssetsMiddleware())

  const assetsRoutePattern = `${options.paths.assets.route}/*`

  app.use(
    assetsRoutePattern,
    serveStatic({
      root: options.paths.assets.directory,
      rewriteRequestPath: (path) => {
        // When basePath is set, the full path including base is passed here
        // We need to strip both the base path and the assets route
        const basePath = options.paths.base === '/' ? '' : options.paths.base
        const fullPrefix = `${basePath}${options.paths.assets.route}`
        return path.replace(new RegExp(`^${fullPrefix}`), '')
      },
      onNotFound(path) {
        console.log('not found', path)
      },
    }),
  )

  // Collect all HTML transformers
  const htmlTransformers: HtmlTransformer[] = [
    // Always inject Polen global data (both dev and prod)
    createPolenDataInjector(),
    // Theme initialization must come after Polen data
    createThemeInitInjector(),
    ...(options.hooks?.transformHtml || []),
  ]

  if (__BUILDING__) {
    // Add manifest transformer
    htmlTransformers.push(createHtmlTransformer((html, ___ctx) => {
      return Ef.succeed(injectManifestIntoHtml(html, viteClientAssetManifest, options.paths.base))
    }))
  }

  app.all(`*`, PageMiddleware(htmlTransformers))

  return app
}

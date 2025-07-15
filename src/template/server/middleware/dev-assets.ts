import type { Hono } from '#dep/hono/index'
import { serveStatic } from '@hono/node-server/serve-static'
import * as NodePath from 'node:path'

/**
 * Middleware to serve development assets (schemas, etc.) from .vite/polen-assets
 * This is only used during development mode.
 */
export const DevAssetsMiddleware = (config: {
  basePath: string
  assetBasePath: string
  frameworkRootDir: string
}): Hono.MiddlewareHandler => {
  const assetUrlPrefix = `${config.basePath}${config.assetBasePath}/`

  return async (c, next) => {
    // Check if this request is for an asset
    if (!c.req.path.startsWith(assetUrlPrefix)) {
      return next()
    }

    // Use serveStatic for matching paths
    const serveStaticHandler = serveStatic({
      root: NodePath.join(config.frameworkRootDir, 'node_modules/.vite/polen-assets'),
      rewriteRequestPath: (path) => {
        // Remove the base path and assets prefix to get the relative file path
        return path.slice(assetUrlPrefix.length)
      },
    })

    return serveStaticHandler(c, next)
  }
}

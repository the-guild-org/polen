import type { Hono } from '#dep/hono/index'
import { AppleTouchIcon } from '#lib/apple-touch-icon/index'
import { Favicon } from '#lib/favicon/index'
import { Http } from '@wollybeard/kit'

/**
 * Temporary middleware to block unsupported asset requests
 *
 * TODO: Polen should eventually support favicon and apple-touch-icon generation
 * For now, we return 404 immediately to prevent these requests from reaching
 * React Router and causing unnecessary processing or errors.
 */
export const UnsupportedAssetsMiddleware = (): Hono.MiddlewareHandler => {
  return async (ctx, next) => {
    // Block these asset requests until Polen supports them
    if (
      Favicon.fileNamePattern.test(ctx.req.path)
      || AppleTouchIcon.fileNamePattern.test(ctx.req.path)
    ) {
      return Http.Response.notFound
    }

    await next()
  }
}

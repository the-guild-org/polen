import type { Hono } from '#dep/hono/index.js'
import { Err, type Http } from '@wollybeard/kit'

/** @see https://github.com/honojs/hono/issues/4051 */
export const delegate = (
  app1: Hono.Hono,
  method: Http.Method | `all`,
  path: string,
  app2: Hono.Hono,
) => {
  app1.on(method, path, (c) => {
    return app2.fetch(
      c.req.raw,
      c.env,
      // Throws if executionCtx is not available
      // https://hono.dev/docs/api/context#executionctx
      Err.tryOrUndefined(() => c.executionCtx),
    )
  })
}

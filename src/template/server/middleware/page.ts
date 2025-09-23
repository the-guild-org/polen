import { Ef } from '#dep/effect'
import type { Hono } from '#dep/hono/index'
import type { HtmlTransformer } from '#lib/html-utils/html-transformer'
import { createPageHtmlResponse } from '../create-page-html-response.js'
import { view } from '../view.js'

export const PageMiddleware = (transformers: HtmlTransformer[]) => {
  return async (ctx: Hono.Context) => {
    const staticHandlerContext = await view.query(ctx.req.raw)

    if (staticHandlerContext instanceof Response) {
      return staticHandlerContext
    }

    // Create an Effect that reduces all transformers
    const transformHtml = (html: string): Ef.Effect<string, never, never> =>
      Ef.reduce(
        transformers,
        html,
        (accHtml, transformer) => transformer(accHtml, ctx),
      )

    return createPageHtmlResponse(staticHandlerContext, {
      transformHtml,
    }, ctx)
  }
}

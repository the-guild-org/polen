import type { Hono } from '#dep/hono/index'
import type { HtmlTransformer } from '#lib/html-utils/html-transformer'
import { asyncReduceWith } from '#lib/kit-temp'
import { createPageHtmlResponse } from '../create-page-html-response.js'
import { view } from '../view.js'

export const PageMiddleware = (transformers: HtmlTransformer[]) => {
  return async (ctx: Hono.Context) => {
    const staticHandlerContext = await view.query(ctx.req.raw)

    if (staticHandlerContext instanceof Response) {
      return staticHandlerContext
    }

    return createPageHtmlResponse(staticHandlerContext, {
      transformHtml: asyncReduceWith(transformers, ctx),
    }, ctx)
  }
}

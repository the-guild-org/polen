import type { Hono } from '#dep/hono/index'
import { asyncReduceWith } from '#lib/kit-temp'
import type { HtmlTransformer } from '../app.ts'
import { createPageHtmlResponse } from '../create-page-html-response.ts'
import { view } from '../view.ts'

export const PageMiddleware = (transformers: HtmlTransformer[]) => {
  return async (ctx: Hono.Context) => {
    const staticHandlerContext = await view.query(ctx.req.raw)

    if (staticHandlerContext instanceof Response) {
      return staticHandlerContext
    }

    return createPageHtmlResponse(staticHandlerContext, {
      transformHtml: asyncReduceWith(transformers, ctx),
    })
  }
}

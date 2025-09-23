import { Ef } from '#dep/effect'
import type { Hono } from '#dep/hono/index'

export type HtmlTransformer = (html: string, ctx: Hono.Context) => Ef.Effect<string, never, never>

export const createHtmlTransformer = <T extends HtmlTransformer>(transformer: T): T => transformer

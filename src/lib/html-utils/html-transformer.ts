import type { Hono } from '#dep/hono/index'
import { Effect } from 'effect'

export type HtmlTransformer = (html: string, ctx: Hono.Context) => Effect.Effect<string, never, never>

export const createHtmlTransformer = <T extends HtmlTransformer>(transformer: T): T => transformer

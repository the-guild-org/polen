import type { Hono } from '#dep/hono/index'
import { Fn } from '@wollybeard/kit'

export type HtmlTransformer = (html: string, ctx: Hono.Context) => Promise<string> | string

export const createHtmlTransformer = Fn.identity<HtmlTransformer>

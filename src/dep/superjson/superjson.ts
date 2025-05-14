import type { Json } from '@wollybeard/kit'
import type { registerCustom } from 'superjson'

export type CustomTransformer<I, O extends Json.Value> = Parameters<
  typeof registerCustom<I, O>
>[0]

export * from 'superjson'

import type { Superjson } from '#dep/superjson'
import type { Json } from '@wollybeard/kit'

export interface Codec<I, O extends Json.Value> {
  name: string
  transformer: Superjson.CustomTransformer<I, O>
}

export const create = <I, O extends Json.Value>(codec: Codec<I, O>): Codec<I, O> => {
  return codec
}

export const register = <I, O extends Json.Value>(
  superjson: Superjson.SuperJSON,
  codec: Codec<I, O>,
): void => {
  superjson.registerCustom(codec.transformer, codec.name)
}

import { Superjson } from '#dep/superjson/index.ts'
import { SuperjsonCodecs } from '#lib/superjson-codec/index.ts'

const superjson = new Superjson.SuperJSON()

SuperjsonCodecs.register(
  superjson,
  SuperjsonCodecs.GraphQLSchema,
)

export { superjson }

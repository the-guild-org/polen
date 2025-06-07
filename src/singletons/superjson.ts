import { Superjson } from '#dep/superjson/index.js'
import { SuperjsonCodecs } from '#lib/superjson-codec/index.js'

const superjson = new Superjson.SuperJSON()

SuperjsonCodecs.register(
  superjson,
  SuperjsonCodecs.GraphQLSchema,
)

export { superjson }

import { Superjson } from '#dep/superjson/index'
import { SuperjsonCodecs } from '#lib/superjson-codec/index'

const superjson = new Superjson.SuperJSON()

SuperjsonCodecs.register(
  superjson,
  SuperjsonCodecs.GraphQLSchema,
)

export { superjson }

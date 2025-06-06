import { Superjson } from '#dep/superjson'
import { SuperjsonCodecs } from '#lib/superjson-codec'

const superjson = new Superjson.SuperJSON()

SuperjsonCodecs.register(
  superjson,
  SuperjsonCodecs.GraphQLSchema,
)

export { superjson }

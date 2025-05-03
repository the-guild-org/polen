import * as Superjson from 'superjson'
import { GrafaidOld } from '#lib/grafaid-old/index.js'

export const registerGraphQLSchema = () => {
  Superjson.registerCustom({
    isApplicable: (value: unknown) => value instanceof GrafaidOld.Schema.Schema,
    serialize: value => {
      const sdl = GrafaidOld.Schema.print(value)

      if (sdl === ``) {
        const astJson = JSON.stringify(GrafaidOld.Schema.astEmpty)
        return astJson
      }

      const ast = GrafaidOld.Schema.parse(sdl)
      const astJson = JSON.stringify(ast)
      return astJson
    },
    deserialize: astJson => {
      return GrafaidOld.Schema.fromAST(JSON.parse(astJson))
    },
  }, `GraphQLSchema`)
}

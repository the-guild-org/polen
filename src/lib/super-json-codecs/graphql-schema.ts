import * as Superjson from 'superjson'
import { Grafaid } from '#lib/grafaid/index.js'

export const registerGraphQLSchema = () => {
  Superjson.registerCustom({
    isApplicable: (value: unknown) => value instanceof Grafaid.Schema.Schema,
    serialize: value => {
      const sdl = Grafaid.Schema.print(value)

      if (sdl === ``) {
        const astJson = JSON.stringify(Grafaid.Schema.AST.empty)
        return astJson
      }

      const ast = Grafaid.Schema.AST.parse(sdl)
      const astJson = JSON.stringify(ast)
      return astJson
    },
    deserialize: astJson => {
      return Grafaid.Schema.fromAST(JSON.parse(astJson))
    },
  }, `GraphQLSchema`)
}

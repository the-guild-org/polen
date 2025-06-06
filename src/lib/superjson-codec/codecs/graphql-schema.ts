import { Grafaid } from '#lib/grafaid/index.ts'
import { create } from '../codec.ts'

export const GraphQLSchema = create({
  name: `GraphQLSchema`,
  transformer: {
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
  },
})

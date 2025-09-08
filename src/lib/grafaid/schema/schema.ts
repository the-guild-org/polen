import { Effect } from 'effect'
import { buildASTSchema, type GraphQLSchema } from 'graphql'
import { makeParseError, ParseError } from '../parse-error.js'

export {
  buildClientSchema as fromIntrospectionQuery,
  GraphQLSchema as Schema,
  introspectionFromSchema as toIntrospectionQuery,
  printSchema as print,
} from 'graphql'

// Effect-based version of fromAST
export const fromAST = (ast: AST.Document): Effect.Effect<GraphQLSchema, ParseError> =>
  Effect.try({
    try: () => buildASTSchema(ast),
    catch: (error) =>
      makeParseError(
        `Failed to build schema from AST: ${error instanceof Error ? error.message : String(error)}`,
        {
          parseType: 'schema',
          cause: error,
        },
      ),
  })

export * as AST from './ast.js'

export * as Type from './type.js'

export * from './type-class-name.js'

export * from './type-kind-name.js'

export * from './RootDetails.js'

export * from './RootTypeMap.js'

export * from './StandardRootTypeName.js'

export * from './KindMap/__.js'

export * from './typeGuards.js'

export * from './scalars.js'

export * as Args from './args.js'

export * as TypesLike from './types-like.js'

export * as NodesLike from './nodes-like.js'

export * from './read.js'

export * from './format-default-value.js'

import * as AST from './ast.js'

export const empty: GraphQLSchema = buildASTSchema(AST.empty)

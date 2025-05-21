import { buildASTSchema, type GraphQLSchema } from 'graphql'

export { buildASTSchema as fromAST, GraphQLSchema as Schema, printSchema as print } from 'graphql'

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

import * as AST from './ast.js'

export const empty: GraphQLSchema = buildASTSchema(AST.empty)

import { buildASTSchema, type GraphQLSchema } from 'graphql'

export {
  buildASTSchema as fromAST,
  buildClientSchema as fromIntrospectionQuery,
  GraphQLSchema as Schema,
  printSchema as print,
} from 'graphql'

export * as AST from './ast.ts'

export * as Type from './type.ts'

export * from './type-class-name.ts'

export * from './type-kind-name.ts'

export * from './RootDetails.ts'

export * from './RootTypeMap.ts'

export * from './StandardRootTypeName.ts'

export * from './KindMap/__.ts'

export * from './typeGuards.ts'

export * from './scalars.ts'

export * as Args from './args.ts'

export * as TypesLike from './types-like.ts'

export * as NodesLike from './nodes-like.ts'

export * from './read.ts'

import * as AST from './ast.ts'

export const empty: GraphQLSchema = buildASTSchema(AST.empty)

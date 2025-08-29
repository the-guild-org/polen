import { S } from '#lib/kit-temp/effect'
import { type DocumentNode } from 'graphql'

const GraphQLIsDocumentNode = (input: unknown): input is DocumentNode =>
  typeof input === 'object'
  && input !== null
  && 'kind' in input
  && (input as any).kind === 'Document'

export const graphqlAst = S.declare(GraphQLIsDocumentNode, {
  identifier: 'GraphQLDocumentNode',
  title: 'GraphQL AST',
  description: 'GraphQL Abstract Syntax Tree',
})

import { buildSchema } from 'graphql'
import { beforeEach, describe, expect, vi } from 'vitest'
import { Test } from '../../../../tests/unit/helpers/test.js'
import { remarkGraphQLReferences } from './remark-graphql-references.js'

const createTree = (inlineCodeValue: string) => ({
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'inlineCode',
          value: inlineCodeValue,
          position: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } },
        },
      ],
    },
  ],
})

const testSchema = buildSchema(`
    type Query {
      user(id: ID!): User
      users: [User!]!
    }

    type User {
      id: ID!
      name: String!
      email: String
      posts: [Post!]!
    }

    type Post {
      id: ID!
      title: String!
      content: String
      author: User!
    }
  `)

const mockSchemaLoader = () => ({
  data: {
    _tag: 'CatalogUnversioned' as const,
    schema: {
      definition: testSchema,
    },
  },
})

const onDiagnostic = vi.fn()
beforeEach(() => {
  onDiagnostic.mockClear()
})

describe('path transformation', () => {
  const transformer = (remarkGraphQLReferences as any)({
    schemaLoader: mockSchemaLoader,
    onDiagnostic,
  })
  const file = { path: 'test.md' }

  // dprint-ignore
  Test.suite<{
      path: string
    }>('transforms gql: paths to GraphQLReference components', [
      { name: 'simple type',       path: 'User' },
      { name: 'field path',        path: 'User.posts' },
      { name: 'query field',       path: 'Query.user' },
      { name: 'nested field',      path: 'Post.author' },
    ], ({ path }) => {
      const tree = createTree(`gql:${path}`)
      transformer(tree, file)

      const paragraph = tree.children[0] as any
      expect(paragraph?.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'GraphQLReference',
        attributes: expect.arrayContaining([
          {
            type: 'mdxJsxAttribute',
            name: 'path',
            value: path,
          },
        ]),
      })

      expect(onDiagnostic).not.toHaveBeenCalled()
    })
})

describe('path validation', () => {
  const transformer = (remarkGraphQLReferences as any)({
    schemaLoader: mockSchemaLoader as any,
    onDiagnostic,
  })
  const file = { path: 'test.md' }

  // dprint-ignore
  Test.suite<{
      path: string
      shouldHaveDiagnostic: boolean
      diagnosticType?: 'invalid-path' | 'invalid-syntax'
    }>('validates GraphQL paths', [
      { name: 'valid type',         path: 'User',            shouldHaveDiagnostic: false },
      { name: 'valid field',        path: 'User.name',       shouldHaveDiagnostic: false },
      { name: 'invalid type',       path: 'InvalidType',     shouldHaveDiagnostic: true,  diagnosticType: 'invalid-path' },
      { name: 'invalid field',      path: 'User.invalid',    shouldHaveDiagnostic: true,  diagnosticType: 'invalid-path' },
      { name: 'double dots',        path: 'User..field',     shouldHaveDiagnostic: true,  diagnosticType: 'invalid-syntax' },
      { name: 'empty segments',     path: '.User.',          shouldHaveDiagnostic: true,  diagnosticType: 'invalid-syntax' },
    ], ({ path, shouldHaveDiagnostic, diagnosticType }) => {
      const tree = createTree(`gql:${path}`)
      transformer(tree, file)

      // Should always transform to GraphQLReference regardless of validity
      const paragraph = tree.children[0] as any
      expect(paragraph?.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'GraphQLReference',
      })

      if (shouldHaveDiagnostic) {
        expect(onDiagnostic).toHaveBeenCalledWith(
          expect.objectContaining({
            _tag: 'Diagnostic',
            source: 'mdx-graphql-references',
            name: diagnosticType,
            severity: 'warning',
          }),
        )
      } else {
        expect(onDiagnostic).not.toHaveBeenCalled()
      }
    })
})

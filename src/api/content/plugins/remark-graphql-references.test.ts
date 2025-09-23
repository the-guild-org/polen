import { Test } from '@wollybeard/kit/test'
import { buildSchema } from 'graphql'
import type { Root } from 'mdast'
import { unified } from 'unified'
import { beforeEach, describe, expect, vi } from 'vitest'
import { remarkGraphQLReferences } from './remark-graphql-references.js'

const createTree = (inlineCodeValue: string): Root => ({
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
  _id: 'Option',
  _tag: 'Some',
  value: {
    data: {
      _id: 'Option',
      _tag: 'Some',
      value: {
        _tag: 'CatalogUnversioned' as const,
        schema: {
          definition: testSchema,
          revisions: [], // Add revisions field to match the full structure
        },
      },
    },
  },
})

const onDiagnostic = vi.fn()
beforeEach(() => {
  onDiagnostic.mockClear()
})

describe('path transformation', () => {
  // Create a unified processor with the plugin
  const processor = unified()
    .use(remarkGraphQLReferences as any, {
      schemaLoader: mockSchemaLoader,
      onDiagnostic,
    })

  const file = { path: 'test.md' }

  type TransformInput = { path: string }
  type TransformOutput = {}

  // dprint-ignore
  Test.Table.suite<TransformInput, TransformOutput>('transforms gql: paths to GraphQLReference components', [
      { n: 'simple type',       i: { path: 'User' },         o: {} },
      { n: 'field path',        i: { path: 'User.posts' },   o: {} },
      { n: 'query field',       i: { path: 'Query.user' },   o: {} },
      { n: 'nested field',      i: { path: 'Post.author' },  o: {} },
    ], ({ i, o }) => {
      const tree = createTree(`gql:${i.path}`)

      // Use runSync to process the tree synchronously
      const result = processor.runSync(tree, file) as Root

      const paragraph = result.children[0] as any
      expect(paragraph?.children?.[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'GraphQLReference',
        attributes: expect.arrayContaining([
          {
            type: 'mdxJsxAttribute',
            name: 'path',
            value: i.path,
          },
        ]),
      })

      expect(onDiagnostic).not.toHaveBeenCalled()
    })
})

describe('path validation', () => {
  // Create a new processor for this test suite
  const processor = unified()
    .use(remarkGraphQLReferences as any, {
      schemaLoader: mockSchemaLoader,
      onDiagnostic,
    })

  const file = { path: 'test.md' }

  type ValidateInput = { path: string }
  type ValidateOutput = { shouldHaveDiagnostic: boolean; diagnosticType?: 'invalid-path' | 'invalid-syntax' }

  // dprint-ignore
  Test.Table.suite<ValidateInput, ValidateOutput>('validates GraphQL paths', [
      { n: 'valid type',         i: { path: 'User' },           o: { shouldHaveDiagnostic: false } },
      { n: 'valid field',        i: { path: 'User.name' },      o: { shouldHaveDiagnostic: false } },
      { n: 'invalid type',       i: { path: 'InvalidType' },    o: { shouldHaveDiagnostic: true, diagnosticType: 'invalid-path' } },
      { n: 'invalid field',      i: { path: 'User.invalid' },   o: { shouldHaveDiagnostic: true, diagnosticType: 'invalid-path' } },
      { n: 'double dots',        i: { path: 'User..field' },    o: { shouldHaveDiagnostic: true, diagnosticType: 'invalid-syntax' } },
      { n: 'empty segments',     i: { path: '.User.' },         o: { shouldHaveDiagnostic: true, diagnosticType: 'invalid-syntax' } },
    ], ({ i, o }) => {
      onDiagnostic.mockClear() // Clear the mock before each test case
      const tree = createTree(`gql:${i.path}`)

      // Use runSync to process the tree
      const result = processor.runSync(tree, file) as Root

      // Should always transform to GraphQLReference regardless of validity
      const paragraph = result.children[0] as any
      expect(paragraph?.children?.[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'GraphQLReference',
      })

      if (o.shouldHaveDiagnostic) {
        expect(onDiagnostic).toHaveBeenCalledWith(
          expect.objectContaining({
            _tag: 'Diagnostic',
            source: 'mdx-graphql-references',
            name: o.diagnosticType,
            severity: 'warning',
          }),
        )
      } else {
        expect(onDiagnostic).not.toHaveBeenCalled()
      }
    })
})

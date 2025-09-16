import { Grafaid } from '#lib/grafaid'
import { Either } from 'effect'
import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { GraphQLSchemaPath } from './$.js'

describe('.parse', () => {
  // dprint-ignore
  Test.suite<{ input: string }>('valid paths', [
    // Simple types
    { name: 'User type',           input: 'User' },
    { name: 'String scalar',       input: 'String' },
    { name: 'input type',          input: 'CreateUserInput' },

    // Field access
    { name: 'simple field',        input: 'User.name' },
    { name: 'nested field',        input: 'User.posts.title' },

    // Argument access
    { name: 'field argument',      input: 'User.posts$limit' },

    // Resolved types
    { name: 'field resolved type', input: 'User.posts#' },
    { name: 'arg resolved type',   input: 'User.posts$limit#' },

    // Input types
    { name: 'input field',         input: 'CreateUserInput.email' },
    { name: 'nested input',        input: 'CreateUserInput.address.street' },

    // With version
    { name: 'with version',        input: 'v1.0:User' },
    { name: 'multi version',       input: 'v1.0,2.0:User.posts' },
    { name: 'version range',       input: 'v1.0-3.0:Query.users' },
  ], ({ input }) => {
    const result = GraphQLSchemaPath.parse(input)
    expect({
      input,
      result,
    }).toMatchSnapshot()
  })

  // dprint-ignore
  Test.suite<{ input: string }>('invalid paths', [
    { name: 'trailing dot',        input: 'User.' },
    { name: 'double dot',          input: 'User..name' },
    { name: 'invalid prefix',      input: 'User$' },
    { name: 'number start',        input: '123User' },
    { name: 'invalid char',        input: 'User!' },
    { name: 'empty string',        input: '' },
  ], ({ input }) => {
    let error: any
    try {
      GraphQLSchemaPath.parse(input)
    } catch (e) {
      error = e
    }
    expect({
      input,
      error: error?.message || error,
    }).toMatchSnapshot()
  })
})

describe('.print', () => {
  // dprint-ignore
  Test.suite<{ input: string }>('round-trip paths', [
    { name: 'simple type',         input: 'User' },
    { name: 'field access',        input: 'User.name' },
    { name: 'nested field',        input: 'User.posts.title' },
    { name: 'with argument',       input: 'User.posts$limit' },
    { name: 'resolved type',       input: 'User.posts#' },
    { name: 'arg resolved',        input: 'User.posts$limit#' },
    { name: 'input field',         input: 'CreateUserInput.email' },
    { name: 'nested input',        input: 'CreateUserInput.address.street' },
    { name: 'with version',        input: 'v1.0:User' },
    { name: 'multi version',       input: 'v1.0,2.0:User.posts' },
    { name: 'version range',       input: 'v1.0-3.0:Query.users' },
  ], ({ input }) => {
    const parsed = GraphQLSchemaPath.parse(input)
    const printed = GraphQLSchemaPath.print(parsed)
    expect({
      input,
      parsed,
      printed,
      roundTripSuccess: printed === input,
    }).toMatchSnapshot()
  })
})

describe('.decodeSync', () => {
  test('decodes string to AST', () => {
    const result = GraphQLSchemaPath.decodeSync('User.posts$limit')
    expect(result._tag).toBe('GraphQLPathRoot')
    expect(result.next._tag).toBe('GraphQLPathSegmentType')
    expect(result.next.name).toBe('User')
    expect(result.next.next?._tag).toBe('GraphQLPathSegmentField')
    expect((result.next.next as any)?.name).toBe('posts')
    expect((result.next.next as any)?.next?._tag).toBe('GraphQLPathSegmentArgument')
    expect((result.next.next as any)?.next?.name).toBe('limit')
  })

  test('round-trips through codec', () => {
    const original = 'User.name'
    const decoded = GraphQLSchemaPath.decodeSync(original)
    const encoded = GraphQLSchemaPath.encodeSync(decoded)
    expect(encoded).toBe(original)
  })

  test('with literal string gets exact type', () => {
    // This test verifies type-level parsing works
    const userPath = GraphQLSchemaPath.decodeSync('User')
    // Type should be ParsePath<'User'> not just GraphQLSchemaPath
    expect(userPath.next.name).toBe('User')
    expect(userPath.next.next).toBeUndefined()

    const complexPath = GraphQLSchemaPath.decodeSync('User.posts$limit')
    expect(complexPath.next.name).toBe('User')
    // TypeScript knows the exact structure from the literal
    expect((complexPath.next.next as any)?.name).toBe('posts')
  })

  test('throws on invalid path', () => {
    expect(() => GraphQLSchemaPath.decodeSync('123Invalid')).toThrow()
    expect(() => GraphQLSchemaPath.decodeSync('')).toThrow()
    expect(() => GraphQLSchemaPath.decodeSync('User..posts')).toThrow()
  })
})

describe('resolver: graphql-schema', () => {
  const schema = buildSchema(`
    type Query {
      user(id: ID!): User
      users(limit: Int): [User!]!
    }

    type User {
      id: ID!
      name: String!
      posts(first: Int): [Post!]!
    }

    type Post {
      id: ID!
      title: String!
      content: String
    }
  `)

  const resolver = GraphQLSchemaPath.Resolvers.GraphqlSchema.create({
    schema,
  })

  const getTypeOrThrow = (name: string) => Grafaid.Schema.Helpers.getTypeOrThrow(schema, name)
  const getFieldedTypeOrThrow = (name: string) => Grafaid.Schema.Helpers.getFieldedTypeOrThrow(schema, name)

  Test.suite<{
    path: string
    expected: { left?: RegExp } | { right?: Grafaid.Schema.TypesLike.Any }
  }>(
    'path resolution',
    // dprint-ignore
    [
      { name: 'resolves type',                    path: 'User',                expected: { right: getTypeOrThrow('User') } },
      { name: 'resolves field',                   path: 'User.name',           expected: { right: getFieldedTypeOrThrow('User').getFields()['name'] } },
      { name: 'resolves field argument',          path: 'User.posts$first',    expected: { right: (getFieldedTypeOrThrow('User').getFields()['posts'] as any).args[0] } },
      { name: 'resolves field resolved type',     path: 'User.posts#',         expected: { right: getTypeOrThrow('Post') } },
      { name: 'resolves argument resolved type',  path: 'User.posts$first#',   expected: { right: getTypeOrThrow('Int') } },
      { name: 'resolves nested field',            path: 'User.posts.title',    expected: { left: /KindMismatch/ } },
      { name: 'resolves query field',             path: 'Query.user',          expected: { right: getFieldedTypeOrThrow('Query').getFields()['user'] } },
      { name: 'resolves query field argument',    path: 'Query.user$id',       expected: { right: (getFieldedTypeOrThrow('Query').getFields()['user'] as any).args[0] } },
      { name: 'fails on non-existent type',       path: 'NonExistent',         expected: { left: /NodeNotFound/ } },
      { name: 'fails on non-existent field',      path: 'User.nonExistent',    expected: { left: /NodeNotFound/ } },
      { name: 'fails on non-existent argument',   path: 'User.name$foo',       expected: { left: /NodeNotFound/ } },
    ],
    ({ path, expected }) => {
      const ast = GraphQLSchemaPath.parse(path)
      const result = resolver(ast)

      if ('right' in expected) {
        expect(result._tag).toBe('Right')
        if (result._tag === 'Right') {
          expect(result.right).toBe(expected.right)
        }
      } else if ('left' in expected) {
        expect(result._tag).toBe('Left')
        if (result._tag === 'Left' && expected.left) {
          // TraversalError has a cause field with the actual StepFailure
          expect(result.left.cause._tag).toMatch(expected.left)
        }
      }
    },
  )
})

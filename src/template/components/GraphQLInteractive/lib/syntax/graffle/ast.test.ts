import { Ei } from '#dep/effect'
import { Test } from '@wollybeard/kit/test'
import { parse } from 'graphql'
import { describe, expect, test } from 'vitest'
import {
  convertDocument,
  graffleDocumentToString,
  GraffleFragmentsNotSupportedError,
  GraffleVariablesNotSupportedError,
} from './ast.js'

describe('convertDocument', () => {
  describe('queries', () => {
    type QueryInput = { graphql: string }
    type QueryOutput = { expected: any }

    // dprint-ignore
    Test.Table.suite<QueryInput, QueryOutput>('valid queries', [
      {
        n: 'simple query with scalar fields',
        i: { graphql: `query { user { id name email } }` },
        o: { expected: {
          query: {
            user: { id: true, name: true, email: true },
          },
        } },
      },
      {
        n: 'anonymous query',
        i: { graphql: `{ hero { name } }` },
        o: { expected: {
          query: {
            hero: { name: true },
          },
        } },
      },
      {
        n: 'named query',
        i: { graphql: `query GetUser { user { name } }` },
        o: { expected: {
          query: {
            GetUser: {
              user: { name: true },
            },
          },
        } },
      },
      {
        n: 'deeply nested selections',
        i: { graphql: `
          query {
            user {
              name
              posts {
                title
                comments {
                  text
                  author { name }
                }
              }
            }
          }
        ` },
        o: { expected: {
          query: {
            user: {
              n: true,
              posts: {
                title: true,
                comments: {
                  text: true,
                  author: { name: true },
                },
              },
            },
          },
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)
      expect(Ei.isRight(result)).toBe(true)
      if (Ei.isRight(result)) {
        expect(result.right).toEqual(o.expected)
      }
    })
  })

  describe('arguments', () => {
    type ArgumentInput = { graphql: string }
    type ArgumentOutput = { expected: any }

    // dprint-ignore
    Test.Table.suite<ArgumentInput, ArgumentOutput>('field arguments', [
      {
        n: 'single argument',
        i: { graphql: `query { user(id: "123") { name } }` },
        o: { expected: {
          query: {
            user: {
              $: { id: '123' },
              n: true,
            },
          },
        } },
      },
      {
        n: 'multiple arguments',
        i: { graphql: `query { users(first: 10, after: "cursor123") { name } }` },
        o: { expected: {
          query: {
            users: {
              $: { first: 10, after: 'cursor123' },
              n: true,
            },
          },
        } },
      },
      {
        n: 'object argument',
        i: { graphql: `query { createUser(input: { name: "John", age: 30 }) { id } }` },
        o: { expected: {
          query: {
            createUser: {
              $: { input: { name: 'John', age: 30 } },
              id: true,
            },
          },
        } },
      },
      {
        n: 'list argument',
        i: { graphql: `query { users(ids: ["1", "2", "3"]) { name } }` },
        o: { expected: {
          query: {
            users: {
              $: { ids: ['1', '2', '3'] },
              n: true,
            },
          },
        } },
      },
      {
        n: 'enum argument',
        i: { graphql: `query { users(role: ADMIN) { name } }` },
        o: { expected: {
          query: {
            users: {
              $: { role: 'ADMIN' },
              n: true,
            },
          },
        } },
      },
      {
        n: 'scalar field with arguments',
        i: { graphql: `query { user { avatar(size: 200) } }` },
        o: { expected: {
          query: {
            user: {
              avatar: { $: { size: 200 } },
            },
          },
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)
      expect(Ei.isRight(result)).toBe(true)
      if (Ei.isRight(result)) {
        expect(result.right).toEqual(o.expected)
      }
    })
  })

  describe('variables', () => {
    type VariableInput = { graphql: string }
    type VariableOutput = { expectedError: { operationName: string; variableNames: string[] } }

    // dprint-ignore
    Test.Table.suite<VariableInput, VariableOutput>('variable errors', [
      {
        n: 'single variable',
        i: { graphql: `query GetUser($id: ID!) { user(id: $id) { name } }` },
        o: { expectedError: {
          operationName: 'GetUser',
          variableNames: ['id'],
        } },
      },
      {
        n: 'multiple variables',
        i: { graphql: `query SearchUsers($name: String!, $limit: Int) { users(name: $name, limit: $limit) { id } }` },
        o: { expectedError: {
          operationName: 'SearchUsers',
          variableNames: ['name', 'limit'],
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)
      expect(Ei.isLeft(result)).toBe(true)
      if (Ei.isLeft(result)) {
        expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
        if (result.left instanceof GraffleVariablesNotSupportedError) {
          expect(result.left.operationName).toBe(o.expectedError.operationName)
          expect(result.left.variableNames).toEqual(o.expectedError.variableNames)
        }
      }
    })
  })

  describe('aliases', () => {
    type AliasInput = { graphql: string }
    type AliasOutput = { expected: any }

    // dprint-ignore
    Test.Table.suite<AliasInput, AliasOutput>('aliases', [
      {
        n: 'field aliases',
        i: { graphql: `
          query {
            admin: user(role: ADMIN) { name }
            regular: user(role: USER) { name }
          }
        ` },
        o: { expected: {
          query: {
            admin: [
              'user',
              {
                $: { role: 'ADMIN' },
                n: true,
              },
            ],
            regular: [
              'user',
              {
                $: { role: 'USER' },
                n: true,
              },
            ],
          },
        } },
      },
      {
        n: 'nested field aliases',
        i: { graphql: `
          query {
            user {
              smallAvatar: avatar(size: 50)
              largeAvatar: avatar(size: 200)
            }
          }
        ` },
        o: { expected: {
          query: {
            user: {
              smallAvatar: [
                'avatar',
                { $: { size: 50 } },
              ],
              largeAvatar: [
                'avatar',
                { $: { size: 200 } },
              ],
            },
          },
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)
      expect(Ei.isRight(result)).toBe(true)
      if (Ei.isRight(result)) {
        expect(result.right).toEqual(o.expected)
      }
    })
  })

  describe('fragments', () => {
    test('named fragment returns error', () => {
      const graphql = `
        fragment UserInfo on User { id name email }
        query { user { ...UserInfo posts { title } } }
      `
      const ast = parse(graphql)
      const result = convertDocument(ast)

      expect(Ei.isLeft(result)).toBe(true)
      if (Ei.isLeft(result)) {
        expect(result.left).toBeInstanceOf(GraffleFragmentsNotSupportedError)
        if (result.left instanceof GraffleFragmentsNotSupportedError) {
          expect(result.left.fragmentNames).toEqual(['UserInfo'])
        }
      }
    })

    test('inline fragment', () => {
      const graphql = `
        query {
          profile {
            ... on User { name email }
            ... on Organization { name members }
          }
        }
      `
      const ast = parse(graphql)
      const result = convertDocument(ast)

      expect(Ei.isRight(result)).toBe(true)
      if (Ei.isRight(result)) {
        expect(result.right).toEqual({
          query: {
            profile: {
              ___on_User: {
                n: true,
                email: true,
              },
              ___on_Organization: {
                n: true,
                members: true,
              },
            },
          },
        })
      }
    })

    test('multiple fragment spreads returns error', () => {
      const graphql = `
        fragment BasicInfo on User { id name }
        fragment ContactInfo on User { email phone }
        query { user { ...BasicInfo ...ContactInfo } }
      `
      const ast = parse(graphql)
      const result = convertDocument(ast)

      expect(Ei.isLeft(result)).toBe(true)
      if (Ei.isLeft(result)) {
        expect(result.left).toBeInstanceOf(GraffleFragmentsNotSupportedError)
        if (result.left instanceof GraffleFragmentsNotSupportedError) {
          expect(result.left.fragmentNames).toEqual(['BasicInfo', 'ContactInfo'])
        }
      }
    })
  })

  describe('directives', () => {
    type DirectiveInput = { graphql: string; expectError?: boolean }
    type DirectiveOutput = { expected?: any; expectedError?: any }

    // dprint-ignore
    Test.Table.suite<DirectiveInput, DirectiveOutput>('directives', [
      {
        n: '@include with variable',
        i: { graphql: `query GetUser($includeEmail: Boolean!) { user { name email @include(if: $includeEmail) } }`, expectError: true },
        o: { expectedError: {
          operationName: 'GetUser',
          variableNames: ['includeEmail'],
        } },
      },
      {
        n: '@skip',
        i: { graphql: `query { user { name internalId @skip(if: true) } }` },
        o: { expected: {
          query: {
            user: {
              n: true,
              internalId: {
                $skip: { if: true },
              },
            },
          },
        } },
      },
      {
        n: 'custom directives',
        i: { graphql: `query { user { name @uppercase email @deprecated(reason: "Use emailAddress") } }` },
        o: { expected: {
          query: {
            user: {
              n: {
                $uppercase: true,
              },
              email: {
                $deprecated: { reason: 'Use emailAddress' },
              },
            },
          },
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)

      if (i.expectError) {
        expect(Ei.isLeft(result)).toBe(true)
        if (Ei.isLeft(result)) {
          expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
          if (result.left instanceof GraffleVariablesNotSupportedError) {
            expect(result.left.operationName).toBe(o.expectedError.operationName)
            expect(result.left.variableNames).toEqual(o.expectedError.variableNames)
          }
        }
      } else {
        expect(Ei.isRight(result)).toBe(true)
        if (Ei.isRight(result)) {
          expect(result.right).toEqual(o.expected)
        }
      }
    })
  })

  describe('mutations', () => {
    type MutationInput = { graphql: string }
    type MutationOutput = { expected?: any; expectedError?: any }

    // dprint-ignore
    Test.Table.suite<MutationInput, MutationOutput>('mutations', [
      {
        n: 'named mutation with variable',
        i: { graphql: `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id name } }` },
        o: { expectedError: {
          operationName: 'CreateUser',
          variableNames: ['input'],
        } },
      },
      {
        n: 'multiple mutations',
        i: { graphql: `mutation { createUser(name: "Alice") { id } createPost(title: "Hello") { id } }` },
        o: { expected: {
          mutation: {
            createUser: {
              $: { name: 'Alice' },
              id: true,
            },
            createPost: {
              $: { title: 'Hello' },
              id: true,
            },
          },
        } },
      },
    ], ({ i, o }) => {
      const ast = parse(i.graphql)
      const result = convertDocument(ast)

      if (o.expectedError) {
        expect(Ei.isLeft(result)).toBe(true)
        if (Ei.isLeft(result)) {
          expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
          if (result.left instanceof GraffleVariablesNotSupportedError) {
            expect(result.left.operationName).toBe(o.expectedError.operationName)
            expect(result.left.variableNames).toEqual(o.expectedError.variableNames)
          }
        }
      } else {
        expect(Ei.isRight(result)).toBe(true)
        if (Ei.isRight(result)) {
          expect(result.right).toEqual(o.expected)
        }
      }
    })
  })

  test('subscription with variable returns error', () => {
    const graphql = `
      subscription OnCommentAdded($postId: ID!) {
        commentAdded(postId: $postId) {
          id
          text
          author { name }
        }
      }
    `
    const ast = parse(graphql)
    const result = convertDocument(ast)

    expect(Ei.isLeft(result)).toBe(true)
    if (Ei.isLeft(result)) {
      expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
      if (result.left instanceof GraffleVariablesNotSupportedError) {
        expect(result.left.operationName).toBe('OnCommentAdded')
        expect(result.left.variableNames).toEqual(['postId'])
      }
    }
  })

  test('document with multiple operations containing variables returns error', () => {
    const graphql = `
      query GetUser { user { name } }
      mutation UpdateUser($input: UpdateUserInput!) { updateUser(input: $input) { id } }
      subscription UserUpdated { userUpdated { id name } }
    `
    const ast = parse(graphql)
    const result = convertDocument(ast)

    // Should fail because UpdateUser has a variable
    expect(Ei.isLeft(result)).toBe(true)
    if (Ei.isLeft(result)) {
      expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
      if (result.left instanceof GraffleVariablesNotSupportedError) {
        expect(result.left.operationName).toBe('UpdateUser')
        expect(result.left.variableNames).toEqual(['input'])
      }
    }
  })

  test('complex query with fragment and variables returns error', () => {
    const graphql = `
      fragment PostFields on Post { id title content }

      query ComplexQuery($userId: ID!, $includeStats: Boolean!) {
        user(id: $userId) {
          name
          email @include(if: $includeStats)
          smallAvatar: avatar(size: 50)
          largeAvatar: avatar(size: 200)
          posts(first: 10, orderBy: CREATED_AT) {
            ...PostFields
            author { name }
            comments {
              text
              ... on Comment { likes }
            }
          }
        }
        allUsers: users { id }
      }
    `
    const ast = parse(graphql)
    const result = convertDocument(ast)

    // Should fail because of fragment (checked first)
    expect(Ei.isLeft(result)).toBe(true)
    if (Ei.isLeft(result)) {
      expect(result.left).toBeInstanceOf(GraffleFragmentsNotSupportedError)
      if (result.left instanceof GraffleFragmentsNotSupportedError) {
        expect(result.left.fragmentNames).toEqual(['PostFields'])
      }
    }
  })
})

describe('graffleDocumentToString', () => {
  type CodeGenInput = { graphql: string; clientName?: string }
  type CodeGenOutput = { expectedCode: string }

  // dprint-ignore
  Test.Table.suite<CodeGenInput, CodeGenOutput>('code generation', [
    {
      n: 'simple query',
      i: { graphql: `query { user { name } }` },
      o: { expectedCode: `await client.document({
  query: {
    user: {
      n: true
    }
  }
}).run()` },
    },
    {
      n: 'query with arguments no variables',
      i: { graphql: `query { user(id: "123") { name email } }` },
      o: { expectedCode: `await client.document({
  query: {
    user: {
      '$': {
        id: '123'
      },
      n: true,
      email: true
    }
  }
}).run()` },
    },
    {
      n: 'named query with variable',
      i: { graphql: `query GetUser($id: ID!) { user(id: $id) { name } }`, clientName: 'pokemon' },
      o: { expectedCode: `await pokemon.document({
  query: {
    GetUser: {
      user: {
        '$': {
          id: variables.id
        },
        n: true
      }
    }
  }
}).run('GetUser')` },
    },
    {
      n: 'mutation',
      i: { graphql: `mutation CreateUser($name: String!) { createUser(name: $name) { id name } }` },
      o: { expectedCode: `await client.document({
  mutation: {
    CreateUser: {
      createUser: {
        '$': {
          n: variables.name
        },
        id: true,
        n: true
      }
    }
  }
}).run('CreateUser')` },
    },
    {
      n: 'query with aliases',
      i: { graphql: `query { admin: user(role: ADMIN) { name } }` },
      o: { expectedCode: `await client.document({
  query: {
    admin: ['user', {
    '$': {
      role: 'ADMIN'
    },
    name: true
  }]
  }
}).run()` },
    },
    {
      n: 'query with directives',
      i: { graphql: `query { user { name email @include(if: true) } }` },
      o: { expectedCode: `await client.document({
  query: {
    user: {
      n: true,
      email: {
        $include: {
          if: true
        }
      }
    }
  }
}).run()` },
    },
  ], ({ i, o }) => {
    const clientName = i.clientName || 'client'
    const ast = parse(i.graphql)
    const result = convertDocument(ast)

    // These tests have variables so they should return errors
    if (i.graphql.includes('$')) {
      expect(Ei.isLeft(result)).toBe(true)
      // Skip code generation test for error cases
      return
    }

    expect(Ei.isRight(result)).toBe(true)
    if (Ei.isRight(result)) {
      const code = graffleDocumentToString(result.right, clientName)
      expect(code).toBe(o.expectedCode)
    }
  })
})

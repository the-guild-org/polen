import { Either } from 'effect'
import { parse } from 'graphql'
import { describe, expect, test } from 'vitest'
import { Test } from '../../../../../../../tests/unit/helpers/test.js'
import {
  convertDocument,
  graffleDocumentToString,
  GraffleFragmentsNotSupportedError,
  GraffleVariablesNotSupportedError,
} from './ast.js'

describe('convertDocument', () => {
  describe('queries', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expected: any }>('valid queries', [
      {
        name: 'simple query with scalar fields',
        graphql: `query { user { id name email } }`,
        expected: {
          query: {
            user: { id: true, name: true, email: true },
          },
        },
      },
      {
        name: 'anonymous query',
        graphql: `{ hero { name } }`,
        expected: {
          query: {
            hero: { name: true },
          },
        },
      },
      {
        name: 'named query',
        graphql: `query GetUser { user { name } }`,
        expected: {
          query: {
            GetUser: {
              user: { name: true },
            },
          },
        },
      },
      {
        name: 'deeply nested selections',
        graphql: `
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
        `,
        expected: {
          query: {
            user: {
              name: true,
              posts: {
                title: true,
                comments: {
                  text: true,
                  author: { name: true },
                },
              },
            },
          },
        },
      },
    ], ({ graphql, expected }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(expected)
      }
    })
  })

  describe('arguments', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expected: any }>('field arguments', [
      {
        name: 'single argument',
        graphql: `query { user(id: "123") { name } }`,
        expected: {
          query: {
            user: {
              $: { id: '123' },
              name: true,
            },
          },
        },
      },
      {
        name: 'multiple arguments',
        graphql: `query { users(first: 10, after: "cursor123") { name } }`,
        expected: {
          query: {
            users: {
              $: { first: 10, after: 'cursor123' },
              name: true,
            },
          },
        },
      },
      {
        name: 'object argument',
        graphql: `query { createUser(input: { name: "John", age: 30 }) { id } }`,
        expected: {
          query: {
            createUser: {
              $: { input: { name: 'John', age: 30 } },
              id: true,
            },
          },
        },
      },
      {
        name: 'list argument',
        graphql: `query { users(ids: ["1", "2", "3"]) { name } }`,
        expected: {
          query: {
            users: {
              $: { ids: ['1', '2', '3'] },
              name: true,
            },
          },
        },
      },
      {
        name: 'enum argument',
        graphql: `query { users(role: ADMIN) { name } }`,
        expected: {
          query: {
            users: {
              $: { role: 'ADMIN' },
              name: true,
            },
          },
        },
      },
      {
        name: 'scalar field with arguments',
        graphql: `query { user { avatar(size: 200) } }`,
        expected: {
          query: {
            user: {
              avatar: { $: { size: 200 } },
            },
          },
        },
      },
    ], ({ graphql, expected }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(expected)
      }
    })
  })

  describe('variables', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expectedError: { operationName: string; variableNames: string[] } }>('variable errors', [
      {
        name: 'single variable',
        graphql: `query GetUser($id: ID!) { user(id: $id) { name } }`,
        expectedError: {
          operationName: 'GetUser',
          variableNames: ['id'],
        },
      },
      {
        name: 'multiple variables',
        graphql: `query SearchUsers($name: String!, $limit: Int) { users(name: $name, limit: $limit) { id } }`,
        expectedError: {
          operationName: 'SearchUsers',
          variableNames: ['name', 'limit'],
        },
      },
    ], ({ graphql, expectedError }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
        if (result.left instanceof GraffleVariablesNotSupportedError) {
          expect(result.left.operationName).toBe(expectedError.operationName)
          expect(result.left.variableNames).toEqual(expectedError.variableNames)
        }
      }
    })
  })

  describe('aliases', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expected: any }>('aliases', [
      {
        name: 'field aliases',
        graphql: `
          query {
            admin: user(role: ADMIN) { name }
            regular: user(role: USER) { name }
          }
        `,
        expected: {
          query: {
            admin: [
              'user',
              {
                $: { role: 'ADMIN' },
                name: true,
              },
            ],
            regular: [
              'user',
              {
                $: { role: 'USER' },
                name: true,
              },
            ],
          },
        },
      },
      {
        name: 'nested field aliases',
        graphql: `
          query {
            user {
              smallAvatar: avatar(size: 50)
              largeAvatar: avatar(size: 200)
            }
          }
        `,
        expected: {
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
        },
      },
    ], ({ graphql, expected }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(expected)
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

      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
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

      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual({
          query: {
            profile: {
              ___on_User: {
                name: true,
                email: true,
              },
              ___on_Organization: {
                name: true,
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

      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(GraffleFragmentsNotSupportedError)
        if (result.left instanceof GraffleFragmentsNotSupportedError) {
          expect(result.left.fragmentNames).toEqual(['BasicInfo', 'ContactInfo'])
        }
      }
    })
  })

  describe('directives', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expected?: any; expectError?: boolean; expectedError?: any }>('directives', [
      {
        name: '@include with variable',
        graphql: `query GetUser($includeEmail: Boolean!) { user { name email @include(if: $includeEmail) } }`,
        expectError: true,
        expectedError: {
          operationName: 'GetUser',
          variableNames: ['includeEmail'],
        },
      },
      {
        name: '@skip',
        graphql: `query { user { name internalId @skip(if: true) } }`,
        expected: {
          query: {
            user: {
              name: true,
              internalId: {
                $skip: { if: true },
              },
            },
          },
        },
      },
      {
        name: 'custom directives',
        graphql: `query { user { name @uppercase email @deprecated(reason: "Use emailAddress") } }`,
        expected: {
          query: {
            user: {
              name: {
                $uppercase: true,
              },
              email: {
                $deprecated: { reason: 'Use emailAddress' },
              },
            },
          },
        },
      },
    ], ({ graphql, expected, expectError, expectedError }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)

      if (expectError) {
        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
          if (result.left instanceof GraffleVariablesNotSupportedError) {
            expect(result.left.operationName).toBe(expectedError.operationName)
            expect(result.left.variableNames).toEqual(expectedError.variableNames)
          }
        }
      } else {
        expect(Either.isRight(result)).toBe(true)
        if (Either.isRight(result)) {
          expect(result.right).toEqual(expected)
        }
      }
    })
  })

  describe('mutations', () => {
    // dprint-ignore
    Test.suite<{ graphql: string; expected?: any; expectedError?: any }>('mutations', [
      {
        name: 'named mutation with variable',
        graphql: `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id name } }`,
        expectedError: {
          operationName: 'CreateUser',
          variableNames: ['input'],
        },
      },
      {
        name: 'multiple mutations',
        graphql: `mutation { createUser(name: "Alice") { id } createPost(title: "Hello") { id } }`,
        expected: {
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
        },
      },
    ], ({ graphql, expected, expectedError }) => {
      const ast = parse(graphql)
      const result = convertDocument(ast)

      if (expectedError) {
        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(GraffleVariablesNotSupportedError)
          if (result.left instanceof GraffleVariablesNotSupportedError) {
            expect(result.left.operationName).toBe(expectedError.operationName)
            expect(result.left.variableNames).toEqual(expectedError.variableNames)
          }
        }
      } else {
        expect(Either.isRight(result)).toBe(true)
        if (Either.isRight(result)) {
          expect(result.right).toEqual(expected)
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

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
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
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
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
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(GraffleFragmentsNotSupportedError)
      if (result.left instanceof GraffleFragmentsNotSupportedError) {
        expect(result.left.fragmentNames).toEqual(['PostFields'])
      }
    }
  })
})

describe('graffleDocumentToString', () => {
  // dprint-ignore
  Test.suite<{ graphql: string; clientName?: string; expectedCode: string }>('code generation', [
    {
      name: 'simple query',
      graphql: `query { user { name } }`,
      expectedCode: `await client.document({
  query: {
    user: {
      name: true
    }
  }
}).run()`,
    },
    {
      name: 'query with arguments no variables',
      graphql: `query { user(id: "123") { name email } }`,
      expectedCode: `await client.document({
  query: {
    user: {
      '$': {
        id: '123'
      },
      name: true,
      email: true
    }
  }
}).run()`,
    },
    {
      name: 'named query with variable',
      graphql: `query GetUser($id: ID!) { user(id: $id) { name } }`,
      clientName: 'pokemon',
      expectedCode: `await pokemon.document({
  query: {
    GetUser: {
      user: {
        '$': {
          id: variables.id
        },
        name: true
      }
    }
  }
}).run('GetUser')`,
    },
    {
      name: 'mutation',
      graphql: `mutation CreateUser($name: String!) { createUser(name: $name) { id name } }`,
      expectedCode: `await client.document({
  mutation: {
    CreateUser: {
      createUser: {
        '$': {
          name: variables.name
        },
        id: true,
        name: true
      }
    }
  }
}).run('CreateUser')`,
    },
    {
      name: 'query with aliases',
      graphql: `query { admin: user(role: ADMIN) { name } }`,
      expectedCode: `await client.document({
  query: {
    admin: ['user', {
    '$': {
      role: 'ADMIN'
    },
    name: true
  }]
  }
}).run()`,
    },
    {
      name: 'query with directives',
      graphql: `query { user { name email @include(if: true) } }`,
      expectedCode: `await client.document({
  query: {
    user: {
      name: true,
      email: {
        $include: {
          if: true
        }
      }
    }
  }
}).run()`,
    },
  ], ({ graphql, clientName = 'client', expectedCode }) => {
    const ast = parse(graphql)
    const result = convertDocument(ast)

    // These tests have variables so they should return errors
    if (graphql.includes('$')) {
      expect(Either.isLeft(result)).toBe(true)
      // Skip code generation test for error cases
      return
    }

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      const code = graffleDocumentToString(result.right, clientName)
      expect(code).toBe(expectedCode)
    }
  })
})

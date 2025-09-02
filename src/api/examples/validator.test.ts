import { buildSchema } from 'graphql'
import { expect, test } from 'vitest'
import { UnversionedExample } from './unversioned.js'
import { validateExamples } from './validator.js'
import { VersionedExample } from './versioned.js'

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    users: [User!]!
  }
  type User {
    id: ID!
    name: String!
    email: String
  }
`)

test.for([
  {
    name: 'valid query returns no diagnostics',
    examples: [UnversionedExample.make({
      name: 'test',
      path: 'test.graphql',
      document: 'query { user(id: "1") { id name } }',
    })],
    expectedDiagnostics: 0,
  },
  {
    name: 'field that does not exist',
    examples: [UnversionedExample.make({
      name: 'test',
      path: 'test.graphql',
      document: 'query { user(id: "1") { id name nonExistentField } }',
    })],
    expectedDiagnostics: 1,
    errorContains: 'Cannot query field',
  },
  {
    name: 'missing required argument',
    examples: [UnversionedExample.make({
      name: 'test',
      path: 'test.graphql',
      document: 'query { user { id name } }',
    })],
    expectedDiagnostics: 1,
    errorContains: 'argument "id" of type "ID!" is required',
  },
  {
    name: 'invalid GraphQL syntax',
    examples: [UnversionedExample.make({
      name: 'test',
      path: 'test.graphql',
      document: 'query { user(id: "1") {{ id name } }',
    })],
    expectedDiagnostics: 1,
    messageContains: 'invalid GraphQL syntax',
  },
  {
    name: 'versioned example validates all versions',
    examples: [VersionedExample.make({
      name: 'test',
      path: 'test.graphql',
      versionDocuments: {
        v1: 'query { user(id: "1") { id name } }',
        v2: 'query { user(id: "1") { id name invalidField } }',
      },
    })],
    expectedDiagnostics: 1,
    version: 'v2',
  },
  {
    name: 'multiple examples with mixed validity',
    examples: [
      UnversionedExample.make({ name: 'valid', path: 'valid.graphql', document: 'query { users { id name } }' }),
      UnversionedExample.make({
        name: 'invalid',
        path: 'invalid.graphql',
        document: 'query { users { id doesNotExist } }',
      }),
    ],
    expectedDiagnostics: 1,
    exampleId: 'invalid',
  },
  {
    name: 'versioned example with default document',
    examples: [VersionedExample.make({
      name: 'test',
      path: 'test.graphql',
      versionDocuments: { v1: 'query { user(id: "1") { id } }' },
      defaultDocument: 'query { user(id: "1") { id invalidField } }',
    })],
    expectedDiagnostics: 1,
    version: 'default',
  },
])(
  'validateExamples - $name',
  ({ examples, expectedDiagnostics, errorContains, messageContains, version, exampleId }) => {
    const diagnostics = validateExamples(examples, schema)

    expect(diagnostics).toHaveLength(expectedDiagnostics)

    if (expectedDiagnostics > 0) {
      const diagnostic = diagnostics[0]!

      if (errorContains) expect(diagnostic.errors[0]?.message).toContain(errorContains)
      if (messageContains) expect(diagnostic.message).toContain(messageContains)
      if (version) expect(diagnostic.version).toBe(version)
      if (exampleId) expect(diagnostic.example.name).toBe(exampleId)

      expect(diagnostic).toMatchObject({
        source: 'examples-validation',
        name: 'invalid-graphql',
        severity: 'error',
      })
    }
  },
)

test('includes location information in errors', () => {
  const examples = [UnversionedExample.make({
    name: 'test',
    path: 'test.graphql',
    document: 'query { user(id: "1") { id invalidField } }',
  })]

  const diagnostics = validateExamples(examples, schema)
  const location = diagnostics[0]?.errors[0]?.locations?.[0]

  expect(location).toMatchObject({
    line: expect.any(Number),
    column: expect.any(Number),
  })
})

test.for([
  {
    name: 'mutation operation',
    schema: buildSchema(`
      type Query { dummy: String }
      type Mutation { createUser(name: String!): User! }
      type User { id: ID! name: String! }
    `),
    document: 'mutation { createUser(name: "Test") { id nonExistentField } }',
  },
  {
    name: 'subscription operation',
    schema: buildSchema(`
      type Query { dummy: String }
      type Subscription { userCreated: User! }
      type User { id: ID! name: String! }
    `),
    document: 'subscription { userCreated { id invalidField } }',
  },
])('validates $name', ({ schema, document }) => {
  const examples = [UnversionedExample.make({ name: 'test', path: 'test.graphql', document })]
  const diagnostics = validateExamples(examples, schema)

  expect(diagnostics).toHaveLength(1)
  expect(diagnostics[0]?.errors[0]?.message).toContain('Cannot query field')
})

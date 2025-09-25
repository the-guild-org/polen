import { HashMap, HashSet } from 'effect'
import { buildSchema } from 'graphql'
import { Catalog, Document, Schema, Version, VersionCoverage } from 'graphql-kit'
import { expect, test } from 'vitest'
import { Example } from '../schemas/example/example.js'
import { validateExamples } from './validator.js'

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

// Create an unversioned catalog for testing
const catalog = Catalog.Unversioned.make({
  schema: Schema.Unversioned.make({
    revisions: [],
    definition: schema,
  }),
})

// Create a versioned catalog for versioned tests
const versionedCatalogForTests = Catalog.Versioned.make({
  entries: HashMap.make(
    [
      Version.fromString('v1'),
      Schema.Versioned.make({
        version: Version.fromString('v1'),
        definition: schema,
        branchPoint: null,
        revisions: [],
      }),
    ],
    [
      Version.fromString('v2'),
      Schema.Versioned.make({
        version: Version.fromString('v2'),
        definition: schema,
        branchPoint: null,
        revisions: [],
      }),
    ],
  ),
})

test.for([
  {
    n: 'valid query returns no diagnostics',
    examples: [Example.make({
      name: 'test',
      path: 'test.graphql',
      document: Document.Unversioned.make({
        document: 'query { user(id: "1") { id name } }',
      }),
    })],
    expectedDiagnostics: 0,
  },
  {
    n: 'field that does not exist',
    examples: [Example.make({
      name: 'test',
      path: 'test.graphql',
      document: Document.Unversioned.make({
        document: 'query { user(id: "1") { id name nonExistentField } }',
      }),
    })],
    expectedDiagnostics: 1,
    errorContains: 'Cannot query field',
  },
  {
    n: 'missing required argument',
    examples: [Example.make({
      name: 'test',
      path: 'test.graphql',
      document: Document.Unversioned.make({
        document: 'query { user { id name } }',
      }),
    })],
    expectedDiagnostics: 1,
    errorContains: 'argument "id" of type "ID!" is required',
  },
  {
    n: 'invalid GraphQL syntax',
    examples: [Example.make({
      name: 'test',
      path: 'test.graphql',
      document: Document.Unversioned.make({
        document: 'query { user(id: "1") {{ id name } }',
      }),
    })],
    expectedDiagnostics: 1,
    messageContains: 'invalid GraphQL syntax',
  },
  {
    n: 'versioned example validates all versions',
    examples: [Example.make({
      name: 'test',
      path: 'test.graphql',
      document: Document.Versioned.make({
        versionDocuments: HashMap.make(
          [VersionCoverage.One.make({ version: Version.fromString('v1') }), 'query { user(id: "1") { id name } }'],
          [
            VersionCoverage.One.make({ version: Version.fromString('v2') }),
            'query { user(id: "1") { id name invalidField } }',
          ],
        ),
      }),
    })],
    expectedDiagnostics: 1,
    version: 'v2',
  },
  {
    n: 'multiple examples with mixed validity',
    examples: [
      Example.make({
        name: 'valid',
        path: 'valid.graphql',
        document: Document.Unversioned.make({
          document: 'query { users { id name } }',
        }),
      }),
      Example.make({
        name: 'invalid',
        path: 'invalid.graphql',
        document: Document.Unversioned.make({
          document: 'query { unknownField }',
        }),
      }),
    ],
    expectedDiagnostics: 1,
    errorContains: 'Cannot query field',
  },
])('%s', ({ examples, expectedDiagnostics, errorContains, messageContains }) => {
  // Use versioned catalog if any example is versioned
  const hasVersionedExample = examples.some(e => e.document._tag === 'DocumentVersioned')
  const catalogToUse = hasVersionedExample ? versionedCatalogForTests : catalog

  const diagnostics = validateExamples(examples, catalogToUse)
  expect(diagnostics.length).toBe(expectedDiagnostics)

  if (errorContains) {
    expect(diagnostics.some(d => d.errors?.some(e => e.message.includes(errorContains)))).toBe(true)
  }

  if (messageContains) {
    expect(diagnostics.some(d => d.message.includes(messageContains))).toBe(true)
  }
})

test('validates versioned catalog with multiple schemas', () => {
  const v1Schema = buildSchema(`
    type Query {
      user(id: ID!): User
    }
    type User {
      id: ID!
      name: String!
    }
  `)

  const v2Schema = buildSchema(`
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

  const versionedCatalog = Catalog.Versioned.make({
    entries: HashMap.make(
      [
        Version.fromString('1.0.0'),
        Schema.Versioned.make({
          version: Version.fromString('1.0.0'),
          revisions: [],
          definition: v1Schema,
          branchPoint: null,
        }),
      ],
      [
        Version.fromString('2.0.0'),
        Schema.Versioned.make({
          version: Version.fromString('2.0.0'),
          revisions: [],
          definition: v2Schema,
          branchPoint: null,
        }),
      ],
    ),
  })

  const v1 = Version.fromString('1.0.0')
  const v2 = Version.fromString('2.0.0')
  const defaultVersions = VersionCoverage.Set.make({ versions: HashSet.make(v1) })

  const examples = [
    Example.make({
      name: 'test-version-sets',
      path: 'test.graphql',
      document: Document.Versioned.make({
        versionDocuments: HashMap.make(
          [defaultVersions, 'query { user(id: "1") { id name } }'],
          [VersionCoverage.One.make({ version: v2 }), 'query { users { id name email } }'],
        ),
      }),
    }),
  ]

  const diagnostics = validateExamples(examples, versionedCatalog)
  expect(diagnostics.length).toBe(0) // Both queries should be valid for their versions
})

test('validates examples against unversioned catalog', () => {
  const examples = [
    Example.make({
      name: 'test-unversioned',
      path: 'test.graphql',
      document: Document.Unversioned.make({
        document: 'query { user(id: "1") { id name } }',
      }),
    }),
  ]

  const diagnostics = validateExamples(examples, catalog)
  expect(diagnostics.length).toBe(0)
})

test('validates examples with version sets', () => {
  const v1 = Version.fromString('v1')
  const v2 = Version.fromString('v2')
  const versionSet = VersionCoverage.Set.make({ versions: HashSet.make(v1, v2) })

  const examples = [
    Example.make({
      name: 'test-version-sets',
      path: 'test.graphql',
      document: Document.Versioned.make({
        versionDocuments: HashMap.make(
          [versionSet, 'query { user(id: "1") { id name } }'],
          [
            VersionCoverage.One.make({ version: Version.fromString('v3') }),
            'query { user(id: "1") { id name invalidField } }',
          ],
        ),
      }),
    }),
  ]

  // Create catalog with v1, v2, v3 versions
  const versionedCatalogWithV3 = Catalog.Versioned.make({
    entries: HashMap.make(
      [
        v1,
        Schema.Versioned.make({
          version: v1,
          definition: schema,
          branchPoint: null,
          revisions: [],
        }),
      ],
      [
        v2,
        Schema.Versioned.make({
          version: v2,
          definition: schema,
          branchPoint: null,
          revisions: [],
        }),
      ],
      [
        Version.fromString('v3'),
        Schema.Versioned.make({
          version: Version.fromString('v3'),
          definition: schema,
          branchPoint: null,
          revisions: [],
        }),
      ],
    ),
  })

  const diagnostics = validateExamples(examples, versionedCatalogWithV3)
  expect(diagnostics.length).toBe(1) // invalidField doesn't exist in the test schema
})

test('detects mismatch between versioned document and unversioned catalog', () => {
  // Create a versioned document with multiple versions
  const v1 = Version.fromString('1.0.0')
  const v2 = Version.fromString('2.0.0')

  const versionedDocument = Document.Versioned.make({
    versionDocuments: HashMap.make(
      [VersionCoverage.One.make({ version: v1 }), 'query { user(id: "1") { id name } }'],
      [VersionCoverage.One.make({ version: v2 }), 'query { users { id name } }'],
    ),
  })

  // Create an example with versioned document
  const example = Example.make({
    name: 'test-version-mismatch',
    path: 'test.graphql',
    document: versionedDocument,
  })

  // Validate against unversioned catalog - should detect mismatch
  const diagnostics = validateExamples([example], catalog)

  // Should have exactly one diagnostic about the version mismatch
  expect(diagnostics.length).toBe(1)
  expect(diagnostics[0]!._tag).toBe('Diagnostic')
  expect(diagnostics[0]!.name).toBe('invalid-graphql')
  expect(diagnostics[0]!.message).toContain('versioned content but catalog is unversioned')
  expect(diagnostics[0]!.errors![0]!.message).toContain('Cannot use a version coverage with an unversioned catalog')
})

import { HashMap, HashSet } from 'effect'
import { buildSchema, type GraphQLSchema } from 'graphql'
import { Catalog, Document, Schema, Version } from 'graphql-kit'
import { describe, expect, test } from 'vitest'
import { Example } from './schemas/example/example.js'
import { ExampleReference } from './schemas/type-usage-index.js'
import { createTypeUsageIndex, getExampleReferencesForType } from './type-usage-indexer.js'

// Test schema
const schemaString = `
  type Query {
    user(id: ID!): User
    users: [User!]!
    product(id: ID!): Product
  }
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type Product {
    id: ID!
    name: String!
    price: Float!
  }
  interface Node {
    id: ID!
  }
  union SearchResult = User | Product
`
const schemaDef = buildSchema(schemaString)
const version1 = Version.decodeSync('1.0.0')
const version2 = Version.decodeSync('2.0.0')

// Test helpers
const makeUnversionedCatalog = (definition: GraphQLSchema) =>
  Catalog.Unversioned.make({
    schema: Schema.Unversioned.make({ definition, revisions: [] }),
  })

const makeVersionedCatalog = (definition: GraphQLSchema, versions: Version.Version[]) =>
  Catalog.Versioned.make({
    entries: HashMap.make(
      ...versions.map(v =>
        [
          v,
          Schema.Versioned.make({
            version: v,
            definition,
            branchPoint: null,
            revisions: [],
          }),
        ] as const
      ),
    ),
  })

describe('createTypeUsageIndex', () => {
  test.for([
    { type: 'Query', shouldExist: true },
    { type: 'User', shouldExist: true },
    { type: 'Product', shouldExist: false },
  ])('indexes unversioned example - type $type indexed=$shouldExist', ({ type, shouldExist }) => {
    const example = Example.make({
      name: 'get-user',
      path: 'examples/get-user.graphql',
      document: Document.Unversioned.make({
        document: 'query { user(id: "1") { id name } }',
      }),
    })

    const index = createTypeUsageIndex([example], makeUnversionedCatalog(schemaDef))
    const refs = getExampleReferencesForType(index, type)

    if (shouldExist) {
      expect(HashSet.size(refs)).toBe(1)
      expect([...refs][0]).toEqual({ name: 'get-user', version: null })
    } else {
      expect(HashSet.size(refs)).toBe(0)
    }
  })

  test.for([version1, version2])(
    'indexes versioned examples for version %s',
    (version) => {
      const example = Example.make({
        name: 'get-user-versioned',
        path: 'examples/get-user-versioned.graphql',
        document: Document.Versioned.make({
          versionDocuments: HashMap.make(
            [version1, 'query { user(id: "1") { id } }'],
            [version2, 'query { user(id: "1") { id name email } }'],
          ),
        }),
      })

      const index = createTypeUsageIndex(
        [example],
        makeVersionedCatalog(schemaDef, [version1, version2]),
      )

      const userRefs = getExampleReferencesForType(index, 'User', version)
      expect(HashSet.size(userRefs)).toBe(1)
      expect([...userRefs][0]).toEqual({ name: 'get-user-versioned', version })
    },
  )

  test('deduplicates example references using HashSet', () => {
    const examples = ['get-user-1', 'get-user-2'].map(name =>
      Example.make({
        name,
        path: `examples/${name}.graphql`,
        document: Document.Unversioned.make({
          document: `query { user(id: "${name}") { id name } }`,
        }),
      })
    )

    const index = createTypeUsageIndex(examples, makeUnversionedCatalog(schemaDef))
    const userRefs = getExampleReferencesForType(index, 'User')

    expect(HashSet.size(userRefs)).toBe(2)
    expect([...userRefs].map(ref => ref.name).sort()).toEqual(['get-user-1', 'get-user-2'])
    expect([...userRefs].every(ref => ref.version === null)).toBe(true)
  })

  test('handles interface and union types', () => {
    const example = Example.make({
      name: 'search',
      path: 'examples/search.graphql',
      document: Document.Unversioned.make({
        document: `query { user(id: "1") { ... on Node { id } } }`,
      }),
    })

    const index = createTypeUsageIndex([example], makeUnversionedCatalog(schemaDef))
    const nodeRefs = getExampleReferencesForType(index, 'Node')

    expect(HashSet.size(nodeRefs)).toBe(1)
    expect([...nodeRefs][0]).toEqual({ name: 'search', version: null })
  })

  test('indexes examples with version sets', () => {
    const versionSet = HashSet.make(version1, version2)
    const example = Example.make({
      name: 'shared-example',
      path: 'examples/shared.graphql',
      document: Document.Versioned.make({
        versionDocuments: HashMap.make([versionSet, 'query { user(id: "1") { id name } }']),
      }),
    })

    const index = createTypeUsageIndex(
      [example],
      makeVersionedCatalog(schemaDef, [version1, version2]),
    )

    // Both versions should have the same example reference
    for (const version of [version1, version2]) {
      const userRefs = getExampleReferencesForType(index, 'User', version)
      expect(HashSet.size(userRefs)).toBe(1)
      expect([...userRefs][0]).toEqual({ name: 'shared-example', version })
    }
  })
})

describe('ExampleReference', () => {
  test('structural equality works with HashSet', () => {
    const version = Version.decodeSync('1.0.0')

    // Create set with duplicates to test deduplication
    const refs = [
      ExampleReference.make({ name: 'example1', version }),
      ExampleReference.make({ name: 'example1', version }), // duplicate
      ExampleReference.make({ name: 'example2', version }),
      ExampleReference.make({ name: 'example3', version: null }),
      ExampleReference.make({ name: 'example3', version: null }), // duplicate
    ]

    const set = refs.reduce(
      (acc, ref) => HashSet.add(acc, ref),
      HashSet.empty<ExampleReference>(),
    )

    // Should have only 3 unique references
    expect(HashSet.size(set)).toBe(3)
    expect(HashSet.has(set, ExampleReference.make({ name: 'example1', version }))).toBe(true)
    expect(HashSet.has(set, ExampleReference.make({ name: 'example2', version }))).toBe(true)
    expect(HashSet.has(set, ExampleReference.make({ name: 'example3', version: null }))).toBe(true)
  })
})

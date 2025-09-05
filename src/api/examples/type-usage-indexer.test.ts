import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { HashMap, HashSet, Schema as S } from 'effect'
import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { Example } from './schemas/example/example.js'
import * as ExampleReferenceModule from './schemas/type-usage-index.js'
import { createTypeUsageIndex, getExampleReferencesForType } from './type-usage-indexer.js'

describe('type-usage-indexer', () => {
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

  describe('createTypeUsageIndex', () => {
    test('indexes unversioned examples', () => {
      const example = Example.make({
        name: 'get-user',
        path: 'examples/get-user.graphql',
        document: Document.Unversioned.make({
          document: 'query { user(id: "1") { id name } }',
        }),
      })

      const catalog = Catalog.Unversioned.make({
        schema: Schema.Unversioned.make({
          definition: schemaDef,
          revisions: [],
        }),
      })

      const index = createTypeUsageIndex([example], catalog)

      // For unversioned examples, they get indexed with the latest version (1.0.0 default)
      const defaultVersion = Version.decodeSync('1.0.0')

      // Should index Query and User types
      const queryRefs = getExampleReferencesForType(index, 'Query')
      const userRefs = getExampleReferencesForType(index, 'User')

      expect(HashSet.size(queryRefs)).toBe(1)
      expect([...queryRefs][0]).toEqual({ name: 'get-user', version: defaultVersion })

      expect(HashSet.size(userRefs)).toBe(1)
      expect([...userRefs][0]).toEqual({ name: 'get-user', version: defaultVersion })

      // Should not index Product type (not used)
      const productRefs = getExampleReferencesForType(index, 'Product')
      expect(HashSet.size(productRefs)).toBe(0)
    })

    test('indexes versioned examples', () => {
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

      const catalog = Catalog.Versioned.make({
        entries: HashMap.make(
          [
            version1,
            Schema.Versioned.make({
              version: version1,
              definition: schemaDef,
              branchPoint: null,
              revisions: [],
            }),
          ],
          [
            version2,
            Schema.Versioned.make({
              version: version2,
              definition: schemaDef,
              branchPoint: null,
              revisions: [],
            }),
          ],
        ),
      })

      const index = createTypeUsageIndex([example], catalog)

      // Check version 1 references
      const userRefsV1 = getExampleReferencesForType(index, 'User', version1)
      expect(HashSet.size(userRefsV1)).toBe(1)
      expect([...userRefsV1][0]).toEqual({ name: 'get-user-versioned', version: version1 })

      // Check version 2 references
      const userRefsV2 = getExampleReferencesForType(index, 'User', version2)
      expect(HashSet.size(userRefsV2)).toBe(1)
      expect([...userRefsV2][0]).toEqual({ name: 'get-user-versioned', version: version2 })
    })

    test('deduplicates example references using HashSet', () => {
      // Create two examples that use the same types
      const example1 = Example.make({
        name: 'get-user-1',
        path: 'examples/get-user-1.graphql',
        document: Document.Unversioned.make({
          document: 'query { user(id: "1") { id name } }',
        }),
      })

      const example2 = Example.make({
        name: 'get-user-2',
        path: 'examples/get-user-2.graphql',
        document: Document.Unversioned.make({
          document: 'query { user(id: "2") { id name } }',
        }),
      })

      const catalog = Catalog.Unversioned.make({
        schema: Schema.Unversioned.make({
          definition: schemaDef,
          revisions: [],
        }),
      })

      const index = createTypeUsageIndex([example1, example2], catalog)

      // For unversioned examples with unversioned catalog, use default version
      const defaultVersion = Version.decodeSync('1.0.0')

      // Both examples should be indexed for User type
      const userRefs = getExampleReferencesForType(index, 'User')
      expect(HashSet.size(userRefs)).toBe(2)

      const refNames = [...userRefs].map(ref => ref.name).sort()
      expect(refNames).toEqual(['get-user-1', 'get-user-2'])

      // All should have the same version
      for (const ref of userRefs) {
        expect(ref.version).toEqual(defaultVersion)
      }
    })

    test('handles interface and union types', () => {
      const example = Example.make({
        name: 'search',
        path: 'examples/search.graphql',
        document: Document.Unversioned.make({
          document: `
            query {
              user(id: "1") {
                ... on Node {
                  id
                }
              }
            }
          `,
        }),
      })

      const catalog = Catalog.Unversioned.make({
        schema: Schema.Unversioned.make({
          definition: schemaDef,
          revisions: [],
        }),
      })

      const index = createTypeUsageIndex([example], catalog)

      // For unversioned example with unversioned catalog
      const defaultVersion = Version.decodeSync('1.0.0')

      // Should index the Node interface
      const nodeRefs = getExampleReferencesForType(index, 'Node')
      expect(HashSet.size(nodeRefs)).toBe(1)
      expect([...nodeRefs][0]).toEqual({ name: 'search', version: defaultVersion })
    })

    test('indexes examples with version sets', () => {
      // Create a versioned document where multiple versions share the same document
      const versionSet = HashSet.make(version1, version2)
      const example = Example.make({
        name: 'shared-example',
        path: 'examples/shared.graphql',
        document: Document.Versioned.make({
          versionDocuments: HashMap.make(
            [versionSet, 'query { user(id: "1") { id name } }'],
          ),
        }),
      })

      const catalog = Catalog.Versioned.make({
        entries: HashMap.make(
          [
            version1,
            Schema.Versioned.make({
              version: version1,
              definition: schemaDef,
              branchPoint: null,
              revisions: [],
            }),
          ],
          [
            version2,
            Schema.Versioned.make({
              version: version2,
              definition: schemaDef,
              branchPoint: null,
              revisions: [],
            }),
          ],
        ),
      })

      const index = createTypeUsageIndex([example], catalog)

      // Both versions should have the same example reference
      const userRefsV1 = getExampleReferencesForType(index, 'User', version1)
      expect(HashSet.size(userRefsV1)).toBe(1)
      expect([...userRefsV1][0]).toEqual({ name: 'shared-example', version: version1 })

      const userRefsV2 = getExampleReferencesForType(index, 'User', version2)
      expect(HashSet.size(userRefsV2)).toBe(1)
      expect([...userRefsV2][0]).toEqual({ name: 'shared-example', version: version2 })
    })
  })

  describe('ExampleReference', () => {
    test('ExampleReference structural equality works with HashSet', () => {
      // Use the Schema's make constructor to create Data instances with proper Equal/Hash support
      const version = Version.decodeSync('1.0.0')

      const ref1 = ExampleReferenceModule.ExampleReference.make({ name: 'example1', version })
      const ref2 = ExampleReferenceModule.ExampleReference.make({ name: 'example1', version })
      const ref3 = ExampleReferenceModule.ExampleReference.make({ name: 'example2', version })

      // Create a HashSet and add references
      let set = HashSet.empty<ExampleReferenceModule.ExampleReference>()
      set = HashSet.add(set, ref1)
      set = HashSet.add(set, ref2) // Should not increase size (duplicate)
      set = HashSet.add(set, ref3)

      // Should have only 2 unique references
      expect(HashSet.size(set)).toBe(2)
      expect(HashSet.has(set, ExampleReferenceModule.ExampleReference.make({ name: 'example1', version }))).toBe(true)
      expect(HashSet.has(set, ExampleReferenceModule.ExampleReference.make({ name: 'example2', version }))).toBe(true)
    })
  })
})

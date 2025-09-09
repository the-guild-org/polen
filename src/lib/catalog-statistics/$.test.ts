import { Catalog } from '#lib/catalog/$'
import { DateOnly } from '#lib/date-only/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { HashMap } from 'effect'
import { buildSchema, type GraphQLSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { CatalogStatistics } from './$.js'

describe('analyzeSchema', () => {
  const testSchema = buildSchema(`
    type Query {
      """Get a user by ID"""
      user(id: ID!): User
      posts: [Post!]!
    }

    type User {
      id: ID!
      """The user's display name"""
      name: String!
      email: String @deprecated(reason: "Use emailAddress instead")
      emailAddress: String
    }

    type Post {
      id: ID!
      title: String!
      content: String
      author: User!
    }

    enum Status {
      DRAFT
      PUBLISHED @deprecated(reason: "Use LIVE instead")
      LIVE
    }

    scalar DateTime
  `)

  test('calculates basic statistics', () => {
    const stats = CatalogStatistics.analyzeSchema(testSchema, '1.0.0', '2024-01-15')

    expect(stats).toMatchObject({
      version: '1.0.0',
      date: '2024-01-15',
      totalTypes: 5, // Query, User, Post, Status, DateTime
      queries: 2,
      mutations: 0,
      subscriptions: 0,
      typeBreakdown: {
        objectTypes: 3, // Query, User, Post
        enumTypes: 1, // Status
        scalarTypes: 1, // DateTime only (built-ins excluded)
      },
      deprecation: {
        fields: 1, // User.email
        enumValues: 1, // Status.PUBLISHED
      },
    })
    expect(stats.descriptionCoverage.fields).toBeGreaterThan(0)
    expect(stats.descriptionCoverage.arguments).toBe(0)
  })

  test.for([
    { ignoreDeprecated: false, expectedFields: 2 },
    { ignoreDeprecated: true, expectedFields: 1 },
  ])('ignoreDeprecated=$ignoreDeprecated yields $expectedFields fields', ({ ignoreDeprecated, expectedFields }) => {
    const schema = buildSchema(`
      type Query {
        current: String
        old: String @deprecated
      }
    `)

    const stats = CatalogStatistics.analyzeSchema(schema, '1.0.0', undefined, { ignoreDeprecated })
    expect(stats.totalFields).toBe(expectedFields)
  })
})

describe('analyzeCatalog', () => {
  const makeVersionedEntry = (version: number, schema: GraphQLSchema, dates: string[]) =>
    Schema.Versioned.make({
      version: Version.fromInteger(version),
      branchPoint: null,
      revisions: dates.map(date => ({ _tag: 'Revision' as const, date: DateOnly.make(date), changes: [] })),
      definition: schema,
    })

  test.for([
    {
      name: 'versioned catalog',
      catalog: () =>
        Catalog.Versioned.make({
          entries: HashMap.make(
            [
              Version.fromInteger(1),
              makeVersionedEntry(1, buildSchema('type Query { hello: String }'), ['2024-01-01', '2024-01-15']),
            ],
            [
              Version.fromInteger(2),
              makeVersionedEntry(
                2,
                buildSchema('type Query { hello: String, world: String } type User { id: ID!, name: String }'),
                ['2024-02-01'],
              ),
            ],
          ),
        }),
      expectedVersions: 2,
      expectedCurrentVersion: '2',
    },
    {
      name: 'unversioned catalog',
      catalog: () =>
        Catalog.Unversioned.make({
          schema: Schema.Unversioned.make({
            revisions: ['2024-01-01', '2024-01-15', '2024-02-01'].map(date => ({
              _tag: 'Revision' as const,
              date: DateOnly.make(date),
              changes: [],
            })),
            definition: buildSchema('type Query { test: String }'),
          }),
        }),
      expectedVersions: 1,
      expectedCurrentVersion: '2024-02-01',
    },
  ])('processes $name', ({ catalog, expectedVersions, expectedCurrentVersion }) => {
    const report = CatalogStatistics.analyzeCatalog(catalog())

    expect(report.versions).toHaveLength(expectedVersions)
    expect(report.current?.version).toBe(expectedCurrentVersion)
    expect(report.stability.totalRevisions).toBe(expectedVersions)
    expect(report.stability.firstRevisionDate).toBeDefined()
    expect(report.stability.lastRevisionDate).toBeDefined()
  })

  test('calculates stability metrics', () => {
    const catalog = Catalog.Versioned.make({
      entries: HashMap.make(
        [
          Version.fromInteger(1),
          makeVersionedEntry(1, buildSchema('type Query { test: String }'), ['2024-01-01', '2024-01-05']),
        ],
        [Version.fromInteger(2), makeVersionedEntry(2, buildSchema('type Query { test: String }'), ['2024-01-10'])],
      ),
    })

    const report = CatalogStatistics.analyzeCatalog(catalog)

    expect(report.stability).toMatchObject({
      totalRevisions: 2,
      averageRevisionInterval: expect.any(Number),
      averageRevisionsPerDay: expect.any(Number),
      churnRate: expect.any(Number),
      rating: expect.stringMatching(/^(high|medium|low)$/),
    })
  })
})

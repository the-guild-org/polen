import { GraphqlChangeset } from '#lib/graphql-changeset'
import { buildSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { SchemaLifecycle } from './$.js'

// Test fixtures
const date1 = new Date('2024-01-01')
const date2 = new Date('2024-02-01')
const schemas = {
  simple: buildSchema(`type Query { hello: String } type User { id: ID! name: String! }`),
  extended: buildSchema(`type Query { hello: String world: String } type User { id: ID! name: String! email: String }`),
  withIVStats: buildSchema(`
    type Query { hello: String world: String }
    type User { id: ID! name: String! email: String }
    type IVStats { hp: Int! attack: Int! defense: Int! }
  `),
}

// Helper to create initial changelog
const createChangelog = (schema = schemas.simple, date = date1): GraphqlChangeset.Changelog => [{
  type: 'InitialChangeSet',
  date,
  after: { version: 'v1', data: schema },
}]

describe('create', () => {
  it('creates lifecycle for initial schema types and fields', () => {
    const lifecycle = SchemaLifecycle.create(createChangelog() as any) as any

    // Check types
    const userTypes = Object.keys(lifecycle.data).filter(t => !['String', 'ID', 'Boolean', 'Int', 'Float'].includes(t))
    expect(userTypes).toEqual(['Query', 'User'])

    // Check Query fields
    expect(Object.keys(lifecycle.data.Query.fields)).toEqual(['hello'])
    expect(lifecycle.data.Query.fields.hello).toMatchObject({
      name: 'hello',
      events: [{ type: 'added', date: date1 }],
    })

    // Check User fields
    expect(Object.keys(lifecycle.data.User.fields)).toEqual(['id', 'name'])
    expect(lifecycle.data.User.fields.id.name).toBe('id')
    expect(lifecycle.data.User.fields.name.name).toBe('name')
  })

  it('handles TYPE_ADDED with fields populated', () => {
    const changelog: GraphqlChangeset.Changelog = [
      ...createChangelog(),
      {
        type: 'IntermediateChangeSet',
        date: date2,
        before: { version: 'v1', data: schemas.simple },
        after: { version: 'v2', data: schemas.withIVStats },
        changes: [{
          type: 'TYPE_ADDED',
          path: 'IVStats',
          criticality: { level: 'NON_BREAKING' },
          message: 'Type IVStats was added',
          meta: { addedTypeName: 'IVStats' },
        }],
      },
    ]
    const lifecycle = SchemaLifecycle.create(changelog as any) as any
    const ivStats = lifecycle.data.IVStats

    expect(ivStats.kind).toBe('Object')
    expect(Object.keys(ivStats.fields)).toEqual(['hp', 'attack', 'defense'])
    expect(ivStats.fields.hp).toMatchObject({ name: 'hp', events: [{ type: 'added', date: date2 }] })
  })

  it('handles field additions', () => {
    const changelog: GraphqlChangeset.Changelog = [
      ...createChangelog(),
      {
        type: 'IntermediateChangeSet',
        date: date2,
        before: { version: 'v1', data: schemas.simple },
        after: { version: 'v2', data: schemas.extended },
        changes: [
          {
            type: 'FIELD_ADDED',
            path: 'Query.world',
            criticality: { level: 'NON_BREAKING' },
            message: '',
            meta: { typeName: 'Query', addedFieldName: 'world', typeType: 'object type' },
          },
          {
            type: 'FIELD_ADDED',
            path: 'User.email',
            criticality: { level: 'NON_BREAKING' },
            message: '',
            meta: { typeName: 'User', addedFieldName: 'email', typeType: 'object type' },
          },
        ],
      },
    ]
    const lifecycle = SchemaLifecycle.create(changelog as any) as any

    expect(lifecycle.data.Query.fields.world).toMatchObject({ name: 'world', events: [{ type: 'added', date: date2 }] })
    expect(lifecycle.data.User.fields.email).toMatchObject({ name: 'email', events: [{ type: 'added', date: date2 }] })
  })
})

describe('serialization', () => {
  it('preserves field lifecycle data through serialization', () => {
    const schema = buildSchema(`
      type Query { hello: String }
      type IVStats {
        hp: Int!
        attack: Int!
        defense: Int!
      }
    `)

    const changelog: GraphqlChangeset.Changelog = [{
      type: 'InitialChangeSet',
      date: date1,
      after: { version: 'v1', data: schema },
    }]

    const lifecycle = SchemaLifecycle.create(changelog as any)

    // Check fields exist before serialization
    expect(lifecycle.data.IVStats?.fields).toBeDefined()
    expect(Object.keys(lifecycle.data.IVStats?.fields || {})).toEqual(['hp', 'attack', 'defense'])

    // Serialize and deserialize
    const json = SchemaLifecycle.toJson(lifecycle)
    const parsed = SchemaLifecycle.fromJson(json)

    // Check fields exist after deserialization
    expect(parsed.data.IVStats?.fields).toBeDefined()
    expect(Object.keys(parsed.data.IVStats?.fields || {})).toEqual(['hp', 'attack', 'defense'])
  })

  it('toJson/fromJson preserves dates and nullifies schemas', () => {
    const lifecycle = SchemaLifecycle.create(createChangelog())
    const json = SchemaLifecycle.toJson(lifecycle)
    const parsed = SchemaLifecycle.fromJson(json) as any

    // Check dates are preserved
    expect(parsed.data.Query.events[0].date).toEqual(date1)
    expect(parsed.data.Query.fields.hello.events[0].date).toEqual(date1)

    // Check schemas are nullified by codec
    expect(parsed.data.Query.events[0].schema.data).toBeNull()
    expect(parsed.data.Query.fields.hello.events[0].schema.data).toBeNull()
  })
})

describe('getters', () => {
  const schemaWithoutUser = buildSchema(`type Query { hello: String }`)
  const changelog: GraphqlChangeset.Changelog = [
    ...createChangelog(),
    {
      type: 'IntermediateChangeSet',
      date: date2,
      before: { version: 'v1', data: schemas.simple },
      after: { version: 'v2', data: schemaWithoutUser },
      changes: [{
        type: 'TYPE_REMOVED',
        path: 'User',
        criticality: { level: 'BREAKING' },
        message: '',
        meta: { removedTypeName: 'User' },
      }],
    },
  ]
  const lifecycle = SchemaLifecycle.create(changelog as any)

  it('getTypeLifecycle', () => expect(SchemaLifecycle.getTypeLifecycle(lifecycle, 'Query')?.name).toBe('Query'))
  it('getTypeAddedDate', () => expect(SchemaLifecycle.getTypeAddedDate(lifecycle, 'Query')).toEqual(date1))
  it('getTypeRemovedDate', () => expect(SchemaLifecycle.getTypeRemovedDate(lifecycle, 'User')).toEqual(date2))
  it('isTypeCurrentlyAvailable', () => {
    expect(SchemaLifecycle.isTypeCurrentlyAvailable(lifecycle, 'Query')).toBe(true)
    expect(SchemaLifecycle.isTypeCurrentlyAvailable(lifecycle, 'User')).toBe(false)
  })
})

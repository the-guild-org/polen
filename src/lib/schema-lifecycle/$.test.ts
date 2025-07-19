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
const createChangelog = (schema = schemas.simple, date = date1): any => [{
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
    const changelog = [
      ...createChangelog(),
      {
        type: 'IntermediateChangeSet',
        date: date2,
        before: { version: 'v1', data: schemas.simple },
        after: { version: 'v2', data: schemas.withIVStats },
        changes: [{
          type: 'TYPE_ADDED',
          path: 'IVStats',
          criticality: { level: 'NON_BREAKING' } as any,
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
    const changelog = [
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
            criticality: { level: 'NON_BREAKING' } as any,
            message: '',
            meta: { typeName: 'Query', addedFieldName: 'world', typeType: 'object type' },
          },
          {
            type: 'FIELD_ADDED',
            path: 'User.email',
            criticality: { level: 'NON_BREAKING' } as any,
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

  it('handles field additions to existing type without explicit FIELD_ADDED events', () => {
    // Simulate a scenario where fields are added but no explicit FIELD_ADDED events exist
    const trainerV1 = buildSchema(`
      type Query { hello: String }
      type Trainer { 
        id: ID!
        name: String!
      }
    `)
    const trainerV2 = buildSchema(`
      type Query { hello: String }
      type Trainer { 
        id: ID!
        name: String!
        battleRecord: String!
        money: Int!
      }
    `)

    const changelog = [
      { type: 'InitialChangeSet', date: date1, after: { version: 'v1', data: trainerV1 } },
      {
        type: 'IntermediateChangeSet',
        date: date2,
        before: { version: 'v1', data: trainerV1 },
        after: { version: 'v2', data: trainerV2 },
        changes: [
          // No explicit FIELD_ADDED events - simulating the missing lifecycle scenario
        ],
      },
    ]
    const lifecycle = SchemaLifecycle.create(changelog as any) as any

    // Original fields should have lifecycle info
    expect(lifecycle.data.Trainer.fields.id).toMatchObject({ name: 'id', events: [{ type: 'added', date: date1 }] })
    expect(lifecycle.data.Trainer.fields.name).toMatchObject({ name: 'name', events: [{ type: 'added', date: date1 }] })

    // New fields without FIELD_ADDED events should NOT have lifecycle info
    expect(lifecycle.data.Trainer.fields.battleRecord).toBeUndefined()
    expect(lifecycle.data.Trainer.fields.money).toBeUndefined()
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

    const changelog = [{
      type: 'InitialChangeSet',
      date: date1,
      after: { version: 'v1', data: schema },
    }]

    const lifecycle = SchemaLifecycle.create(changelog as any)

    // Check fields exist before serialization
    const ivStatsBefore = lifecycle.data['IVStats'] as any
    expect(ivStatsBefore?.fields).toBeDefined()
    expect(Object.keys(ivStatsBefore?.fields || {})).toEqual(['hp', 'attack', 'defense'])

    // Serialize and deserialize
    const json = SchemaLifecycle.toJson(lifecycle)
    const parsed = SchemaLifecycle.fromJson(json)

    // Check fields exist after deserialization
    const ivStatsAfter = parsed.data['IVStats'] as any
    expect(ivStatsAfter?.fields).toBeDefined()
    expect(Object.keys(ivStatsAfter?.fields || {})).toEqual(['hp', 'attack', 'defense'])
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
  const changelog = [
    ...createChangelog(),
    {
      type: 'IntermediateChangeSet',
      date: date2,
      before: { version: 'v1', data: schemas.simple },
      after: { version: 'v2', data: schemaWithoutUser },
      changes: [{
        type: 'TYPE_REMOVED',
        path: 'User',
        criticality: { level: 'BREAKING' } as any,
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

import { describe, expect, test } from 'vitest'
import * as SchemaDefinition from '../schema-definition/schema-definition.js'
import { Version } from '../version/$.js'
import { Schema } from './$.js'

describe('Schema', () => {
  const mockGraphQLSchema = SchemaDefinition.sdl.decode(`
    type Query {
      hello: String
    }
  `)

  test('creates versioned schema', () => {
    const versionedSchema = Schema.Versioned.make({
      version: Version.decodeSync('1.0.0'),
      parent: null,
      revisions: [],
      definition: mockGraphQLSchema as any,
    })

    expect(versionedSchema._tag).toBe('SchemaVersioned')
    expect(Version.toString(versionedSchema.version)).toBe('1.0.0')
  })

  test('creates unversioned schema', () => {
    const unversionedSchema = Schema.Unversioned.make({
      revisions: [],
      definition: mockGraphQLSchema as any,
    })

    expect(unversionedSchema._tag).toBe('SchemaUnversioned')
  })

  test('type guards work correctly for union', () => {
    const versionedSchema = Schema.Versioned.make({
      version: Version.decodeSync('1.0.0'),
      parent: null,
      revisions: [],
      definition: mockGraphQLSchema as any,
    })

    const unversionedSchema = Schema.Unversioned.make({
      revisions: [],
      definition: mockGraphQLSchema as any,
    })

    expect(Schema.is(versionedSchema)).toBe(true)
    expect(Schema.is(unversionedSchema)).toBe(true)
    expect(Schema.Versioned.is(versionedSchema)).toBe(true)
    expect(Schema.Versioned.is(unversionedSchema)).toBe(false)
    expect(Schema.Unversioned.is(versionedSchema)).toBe(false)
    expect(Schema.Unversioned.is(unversionedSchema)).toBe(true)
  })
})

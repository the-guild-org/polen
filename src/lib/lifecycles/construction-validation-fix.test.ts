import { DateOnly } from '#lib/date-only/$'
import { describe, expect, test } from '@effect/vitest'
import { buildSchema } from 'graphql'
import { Catalog } from '../catalog/$.js'
import { Revision } from '../revision/$.js'
import { Schema } from '../schema/$.js'
import { Version } from '../version/$.js'
import { Lifecycles } from './$.js'

describe('lifecycles construction vs validation fix', () => {
  test('FAILING: Lifecycles.create should work with already-constructed schemas', () => {
    // This test should pass after we fix the construction vs validation issue
    const schema = buildSchema(`type Query { hello: String }`)
    const version = Version.fromString('1.0.0') as any
    const revision = Revision.make({ date: DateOnly.make('2024-01-01'), changes: [] })

    const versionedSchema = Schema.Versioned.make({
      version,
      parent: null,
      revisions: [revision],
      definition: schema,
    })

    const catalog = Catalog.Versioned.make({
      entries: [{ schema: versionedSchema, parent: null, revisions: [revision] }],
    })

    // This should NOT throw - the construction vs validation issue should be fixed
    expect(() => {
      const result = Lifecycles.create(catalog)
      expect(result).toBeDefined()
      expect(result._tag).toBe('Lifecycles')
    }).not.toThrow()
  })
})

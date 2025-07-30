import { describe, expect, test } from 'vitest'
import * as SchemaDefinition from './schema-definition.js'

describe('SchemaDefinition', () => {
  const sdl1 = `
    type Query {
      hello: String
      world: String
    }
  `

  const sdl2 = `
    type Query {
      world: String
      hello: String
    }
  `

  test('sdl.decode creates schema from SDL string', () => {
    const schema = SchemaDefinition.sdl.decode(sdl1)
    expect(SchemaDefinition.is(schema)).toBe(true)
    expect(SchemaDefinition.sdl.encode(schema)).toContain('type Query')
  })

  test('equivalence compares schemas by SDL representation', () => {
    const schema1 = SchemaDefinition.sdl.decode(sdl1)
    const schema2 = SchemaDefinition.sdl.decode(sdl2)
    const schema3 = SchemaDefinition.sdl.decode(sdl1)

    // GraphQL preserves field order, so different order means different SDL
    expect(SchemaDefinition.equivalence(schema1, schema2)).toBe(false)
    // Same SDL produces equivalent schemas
    expect(SchemaDefinition.equivalence(schema1, schema3)).toBe(true)
  })

  test('isEmpty detects empty schemas', () => {
    const emptySchema = SchemaDefinition.sdl.decode(`type Query`)
    const nonEmptySchema = SchemaDefinition.sdl.decode(sdl1)

    expect(SchemaDefinition.isEmpty(emptySchema)).toBe(true)
    expect(SchemaDefinition.isEmpty(nonEmptySchema)).toBe(false)
  })
})

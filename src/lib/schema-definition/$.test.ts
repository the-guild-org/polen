import { expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import * as SchemaDefinition from './schema-definition.js'

interface SchemaTestCase {
  sdl: string
  operation: 'decode' | 'isEmpty'
  expected: boolean | string
}

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

// dprint-ignore
Test.suite<SchemaTestCase>('SchemaDefinition', [
  { name: 'sdl.decode creates schema from SDL string',  sdl: sdl1,          operation: 'decode',  expected: 'type Query' },
  { name: 'isEmpty detects empty schemas',              sdl: `type Query`,  operation: 'isEmpty', expected: true },
  { name: 'isEmpty returns false for non-empty',        sdl: sdl1,          operation: 'isEmpty', expected: false },
], ({ sdl, operation, expected }) => {
  const schema = SchemaDefinition.sdl.decode(sdl)
  
  switch (operation) {
    case 'decode':
      expect(SchemaDefinition.is(schema)).toBe(true)
      expect(SchemaDefinition.sdl.encode(schema)).toContain(expected as string)
      break
    case 'isEmpty':
      expect(SchemaDefinition.isEmpty(schema as any)).toBe(expected)
      break
  }
})

interface EquivalenceTestCase {
  sdl1: string
  sdl2: string
  shouldBeEqual: boolean
}

// dprint-ignore
Test.suite<EquivalenceTestCase>('equivalence', [
  { name: 'different field order means different SDL',  sdl1: sdl1, sdl2: sdl2, shouldBeEqual: false },
  { name: 'same SDL produces equivalent schemas',       sdl1: sdl1, sdl2: sdl1, shouldBeEqual: true },
], ({ sdl1, sdl2, shouldBeEqual }) => {
  const schema1 = SchemaDefinition.sdl.decode(sdl1)
  const schema2 = SchemaDefinition.sdl.decode(sdl2)
  expect(SchemaDefinition.equivalence(schema1 as any, schema2 as any)).toBe(shouldBeEqual)
})

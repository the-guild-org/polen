import { SchemaDefinition } from '#lib/schema-definition/$'
import { buildSchema } from 'graphql'
import { describe, expect, test } from 'vitest'
import { processCategories, processCategoriesWithVersion } from './categories-processor.js'

describe('categories-processor', () => {
  const createTestSchema = (sdl: string): SchemaDefinition.SchemaDefinition => {
    const schema = buildSchema(sdl) as SchemaDefinition.SchemaDefinition
    return schema
  }

  describe('processCategories', () => {
    test('processes empty categories config', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
      `)

      const result = processCategories(schema, undefined)
      expect(result).toEqual([])
    })

    test('matches types by exact string', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
        type ValidationError {
          field: String
        }
      `)

      const result = processCategories(schema, [
        {
          name: 'Specific Errors',
          typeNames: ['UserError'],
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Specific Errors')
      expect(result[0]!.types).toHaveLength(1)
      expect(result[0]!.types[0]).toBe('UserError')
    })

    test('matches types by RegExp pattern', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
        type ValidationError {
          field: String
        }
        type SystemError {
          code: Int
        }
        type User {
          id: ID
        }
      `)

      const result = processCategories(schema, [
        {
          name: 'Errors',
          typeNames: [/.*Error$/],
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Errors')
      expect(result[0]!.types).toHaveLength(3)
      const typeNames = result[0]!.types.sort()
      expect(typeNames).toEqual(['SystemError', 'UserError', 'ValidationError'])
    })

    test('handles exclude mode', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
        type ValidationError {
          field: String
        }
        type SystemError {
          code: Int
        }
        type User {
          id: ID
        }
      `)

      const result = processCategories(schema, [
        {
          name: 'Non-Errors',
          typeNames: [/.*Error$/],
          mode: 'exclude',
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Non-Errors')
      expect(result[0]!.types).toHaveLength(2)
      const typeNames = result[0]!.types.sort()
      expect(typeNames).toEqual(['Query', 'User'])
    })

    test('handles mixed string and RegExp patterns', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
        type CustomException {
          details: String
        }
        type ValidationError {
          field: String
        }
        type User {
          id: ID
        }
      `)

      const result = processCategories(schema, [
        {
          name: 'Error Types',
          typeNames: ['CustomException', /.*Error$/],
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Error Types')
      expect(result[0]!.types).toHaveLength(3)
      const typeNames = result[0]!.types.sort()
      expect(typeNames).toEqual(['CustomException', 'UserError', 'ValidationError'])
    })

    test('handles multiple categories', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
        type UserInput {
          name: String
        }
        type PostInput {
          title: String
        }
      `)

      const result = processCategories(schema, [
        {
          name: 'Errors',
          typeNames: [/.*Error$/],
        },
        {
          name: 'Inputs',
          typeNames: [/.*Input$/],
        },
      ])

      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('Errors')
      expect(result[0]!.types).toHaveLength(1)
      expect(result[1]!.name).toBe('Inputs')
      expect(result[1]!.types).toHaveLength(2)
    })

    test('filters out introspection types', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
      `)

      // Introspection types start with __ and should be filtered out
      const result = processCategories(schema, [
        {
          name: 'All Types',
          typeNames: [/.*/],
        },
      ])

      // Should not include __Schema, __Type, etc.
      const typeNames = result[0]!.types
      expect(typeNames).not.toContain('__Schema')
      expect(typeNames).not.toContain('__Type')
      expect(typeNames).toContain('Query')
      expect(typeNames).toContain('UserError')
    })
  })

  describe('processCategoriesWithVersion', () => {
    test('handles plain array configuration', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
      `)

      const result = processCategoriesWithVersion(
        schema,
        [
          {
            name: 'Errors',
            typeNames: [/.*Error$/],
          },
        ],
        undefined,
      )

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Errors')
    })

    test('handles versioned configuration with matching version', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
      `)

      const result = processCategoriesWithVersion(
        schema,
        {
          '2024-01-01': [
            {
              name: 'V1 Errors',
              typeNames: [/.*Error$/],
            },
          ],
          '2024-06-01': [
            {
              name: 'V2 Errors',
              typeNames: [/.*Error$/],
            },
          ],
        },
        '2024-06-01',
      )

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('V2 Errors')
    })

    test('handles versioned configuration with no matching version', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
        type UserError {
          message: String
        }
      `)

      const result = processCategoriesWithVersion(
        schema,
        {
          '2024-01-01': [
            {
              name: 'V1 Errors',
              typeNames: [/.*Error$/],
            },
          ],
        },
        '2024-12-01', // No matching version
      )

      expect(result).toEqual([])
    })

    test('handles undefined configuration', () => {
      const schema = createTestSchema(`
        type Query {
          hello: String
        }
      `)

      const result = processCategoriesWithVersion(schema, undefined, undefined)
      expect(result).toEqual([])
    })
  })
})

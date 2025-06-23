import { describe, expect, it } from 'vitest'
import { GraphQLDocument } from './$.ts'

describe('GraphQLDocument', () => {
  describe('analyze', () => {
    it('should parse a simple query and extract identifiers', () => {
      const source = `
        query GetUser($id: ID!) {
          user(id: $id) {
            name
            email
          }
        }
      `

      const result = GraphQLDocument.analyze(source)

      expect(result.isValid).toBe(true)
      expect(result.identifiers.all.length).toBeGreaterThan(0)

      // Should find variable
      const variables = result.identifiers.byKind.get('Variable') || []
      expect(variables).toHaveLength(1)
      expect(variables[0]?.name).toBe('id')

      // Should find fields
      const fields = result.identifiers.byKind.get('Field') || []
      expect(fields.length).toBeGreaterThan(0)
      const fieldNames = fields.map(f => f.name)
      expect(fieldNames).toContain('user')
      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('email')

      // Should find types
      const types = result.identifiers.byKind.get('Type') || []
      expect(types.length).toBeGreaterThan(0)
      const typeNames = types.map(t => t.name)
      expect(typeNames).toContain('ID')
    })

    it('should handle parsing errors gracefully', () => {
      const invalidSource = `
        query {
          user(id: $id {
            name
          }
        }
      `

      const result = GraphQLDocument.analyze(invalidSource)

      expect(result.isValid).toBe(false)
      expect(result.identifiers.errors.length).toBeGreaterThan(0)
    })

    it('should extract context information', () => {
      const source = `
        query GetUserPosts($userId: ID!) {
          user(id: $userId) {
            posts {
              title
              content
            }
          }
        }
      `

      const result = GraphQLDocument.analyze(source)

      const fields = result.identifiers.byKind.get('Field') || []
      const userField = fields.find(f => f.name === 'user')

      expect(userField?.context.operationType).toBe('query')
      expect(userField?.context.operationName).toBe('GetUserPosts')
      expect(userField?.context.selectionPath).toEqual(['user'])
    })

    it('should track parent types in nested selections', () => {
      const source = `
        query {
          user {
            posts {
              title
            }
          }
        }
      `

      const result = GraphQLDocument.analyze(source)

      const fields = result.identifiers.byKind.get('Field') || []
      const titleField = fields.find(f => f.name === 'title')

      expect(titleField?.schemaPath).toEqual(['Post', 'title'])
    })
  })

  describe('extractIdentifiers', () => {
    it('should extract identifiers with positions', () => {
      const source = `query { user { name } }`

      const identifiers = GraphQLDocument.extractIdentifiers(source)

      expect(identifiers.all.length).toBeGreaterThan(0)

      // Each identifier should have position information
      for (const identifier of identifiers.all) {
        expect(identifier.position.start).toBeTypeOf('number')
        expect(identifier.position.end).toBeTypeOf('number')
        expect(identifier.position.line).toBeGreaterThan(0)
        expect(identifier.position.column).toBeGreaterThan(0)
      }
    })

    it('should create proper index maps', () => {
      const source = `query { user { name } }`

      const identifiers = GraphQLDocument.extractIdentifiers(source)

      // Should have position index
      expect(identifiers.byPosition.size).toBeGreaterThan(0)

      // Should have kind index
      expect(identifiers.byKind.size).toBeGreaterThan(0)

      // All identifiers should be indexed
      for (const identifier of identifiers.all) {
        expect(identifiers.byPosition.get(identifier.position.start)).toBe(identifier)
      }
    })
  })
})

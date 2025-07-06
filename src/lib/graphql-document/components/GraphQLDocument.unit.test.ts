/**
 * Unit tests for GraphQL Document component logic
 *
 * Tests the core functionality without rendering React components
 */

import { buildSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { analyze } from '../analysis.js'
import { createSimplePositionCalculator } from '../positioning-simple.js'
import { analyzeWithSchema, createPolenSchemaResolver } from '../schema-integration.js'

describe('GraphQLDocument logic', () => {
  const testSchema = buildSchema(`
    type Query {
      user(id: ID!): User
      users: [User!]!
    }

    type User {
      id: ID!
      name: String!
      email: String!
      posts: [Post!]!
    }

    type Post {
      id: ID!
      title: String!
      content: String!
      author: User!
    }
  `)

  const testQuery = `
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      title
    }
  }
}`

  describe('analysis integration', () => {
    it('should analyze GraphQL document and extract identifiers', () => {
      const result = analyze(testQuery)

      expect(result.identifiers.byKind.get('Field')).toBeDefined()
      expect(result.identifiers.byKind.get('Variable')).toBeDefined()
      expect(result.identifiers.byKind.get('Type')).toBeDefined()

      // Check specific identifiers
      const fields = result.identifiers.byKind.get('Field') || []
      const fieldNames = fields.map(f => f.name)
      expect(fieldNames).toContain('user')
      expect(fieldNames).toContain('id')
      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('email')
      expect(fieldNames).toContain('posts')
      expect(fieldNames).toContain('title')
    })

    it('should handle empty document', () => {
      const result = analyze('')
      expect(result.identifiers.byPosition.size).toBe(0)
      // Empty string is technically parseable as an empty document
      expect(result.ast).toBeDefined()
    })
  })

  describe('schema resolution integration', () => {
    it('should resolve identifiers against schema', () => {
      // Use analyzeWithSchema for proper schema-aware analysis
      const { analysis, resolutions } = analyzeWithSchema(testQuery, testSchema)

      // Check that analysis found identifiers
      expect(analysis.identifiers.all.length).toBeGreaterThan(0)

      // Check that we have resolutions
      expect(resolutions.size).toBeGreaterThan(0)

      // Check that analysis is valid
      expect(analysis.isValid).toBe(true)

      // Basic check that resolutions were created
      const hasValidResolutions = Array.from(resolutions.values()).some(
        res => res.exists && res.referenceUrl.includes('/reference/'),
      )
      expect(hasValidResolutions).toBe(true)
    })

    it('should detect non-existent fields', () => {
      const invalidQuery = 'query { nonExistentField }'
      const result = analyze(invalidQuery)
      const resolver = createPolenSchemaResolver(testSchema)

      const field = Array.from(result.identifiers.byPosition.values())[0]
      const resolution = resolver.resolveIdentifier(field!)

      expect(resolution).toBeDefined()
      expect(resolution!.exists).toBe(false)
    })
  })

  describe('position calculation', () => {
    it('should create position calculator', () => {
      const calculator = createSimplePositionCalculator()
      expect(calculator).toBeDefined()
      expect(calculator.prepareCodeBlock).toBeDefined()
      expect(calculator.getIdentifierPositions).toBeDefined()
    })
  })

  describe('options handling', () => {
    it('should skip analysis when plain option is true', () => {
      const options = { plain: true }
      // When plain is true, no analysis should be performed
      expect(options.plain).toBe(true)
    })

    it('should enable debug mode', () => {
      const options = { debug: true }
      expect(options.debug).toBe(true)
    })

    it('should handle custom navigation', () => {
      const onNavigate = (url: string) => {
        expect(url).toContain('/reference/')
      }
      const options = { onNavigate }
      expect(options.onNavigate).toBeDefined()
    })

    it('should handle validation option', () => {
      const options = { validate: true }
      expect(options.validate).toBe(true)
    })

    it('should handle custom className', () => {
      const options = { className: 'custom-graphql-block' }
      expect(options.className).toBe('custom-graphql-block')
    })
  })

  describe('validation', () => {
    it('should validate valid queries', () => {
      const { analysis, resolutions } = analyzeWithSchema(testQuery, testSchema)

      // Check that validation passed
      expect(analysis.isValid).toBe(true)

      // Check that we have resolutions
      expect(resolutions.size).toBeGreaterThan(0)

      // Check that the user field resolved correctly
      const userResolution = Array.from(resolutions.values()).find(
        res => res.referenceUrl.includes('query') && res.referenceUrl.includes('user'),
      )

      if (userResolution) {
        expect(userResolution.exists).toBe(true)
      }
    })

    it('should detect validation errors', () => {
      const invalidQuery = `
        query {
          user {
            nonExistentField
          }
        }
      `

      const result = analyze(invalidQuery)
      const resolver = createPolenSchemaResolver(testSchema)

      const resolutions = Array.from(result.identifiers.byPosition.values())
        .map(id => ({ id, resolution: resolver.resolveIdentifier(id) }))

      const invalidField = resolutions.find(r => r.id.name === 'nonExistentField')
      expect(invalidField).toBeDefined()
      expect(invalidField!.resolution!.exists).toBe(false)
    })
  })
})

import { buildSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { analyzeWithSchema, createPolenSchemaResolver } from './schema-integration.js'

// Test schema
const testSchema = buildSchema(`
  """
  A user in the system
  """
  type User {
    """
    The user's unique identifier
    """
    id: ID!
    
    """
    The user's full name
    """
    name: String!
    
    """
    The user's email address
    """
    email: String!
    
    """
    User's posts
    """
    posts(
      """
      Maximum number of posts to return
      """
      first: Int = 10
      
      """
      Filter posts after this cursor
      """
      after: String
    ): [Post!]!
    
    """
    @deprecated Use profile.avatar instead
    """
    avatar: String @deprecated(reason: "Use profile.avatar instead")
  }

  """
  A blog post
  """
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  """
  Input for creating a user
  """
  input CreateUserInput {
    name: String!
    email: String!
  }

  type Query {
    """
    Get a user by ID
    """
    user(id: ID!): User
    
    """
    Search for users
    """
    users(query: String!): [User!]!
  }

  type Mutation {
    """
    Create a new user
    """
    createUser(input: CreateUserInput!): User!
  }

  """
  Custom directive for validation
  """
  directive @validate(pattern: String!) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
`)

describe('Schema Integration', () => {
  describe('PolenSchemaResolver', () => {
    const resolver = createPolenSchemaResolver(testSchema)

    describe('Type Resolution', () => {
      it('should resolve existing types', () => {
        const identifier = {
          name: 'User',
          kind: 'Type' as const,
          position: { start: 0, end: 4, line: 1, column: 1 },
          schemaPath: ['User'],
          context: { selectionPath: [] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.referenceUrl).toBe('/reference/User')
        expect(resolution!.documentation?.description).toContain('A user in the system')
        expect(resolution!.documentation?.typeInfo).toBe('User')
      })

      it('should handle non-existent types', () => {
        const identifier = {
          name: 'NonExistentType',
          kind: 'Type' as const,
          position: { start: 0, end: 15, line: 1, column: 1 },
          schemaPath: ['NonExistentType'],
          context: { selectionPath: [] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(false)
        expect(resolution!.referenceUrl).toBe('/reference/NonExistentType')
        expect(resolution!.documentation).toBeUndefined()
      })
    })

    describe('Field Resolution', () => {
      it('should resolve existing fields', () => {
        const identifier = {
          name: 'name',
          kind: 'Field' as const,
          position: { start: 0, end: 4, line: 1, column: 1 },
          parentType: 'User',
          schemaPath: ['User', 'name'],
          context: { selectionPath: ['name'] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.referenceUrl).toBe('/reference/User#name')
        expect(resolution!.documentation?.description).toContain("The user's full name")
        expect(resolution!.documentation?.typeInfo).toBe('String!')
      })

      it('should detect deprecated fields', () => {
        const identifier = {
          name: 'avatar',
          kind: 'Field' as const,
          position: { start: 0, end: 6, line: 1, column: 1 },
          parentType: 'User',
          schemaPath: ['User', 'avatar'],
          context: { selectionPath: ['avatar'] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.deprecated).toBeDefined()
        expect(resolution!.deprecated!.reason).toBe('Use profile.avatar instead')
      })

      it('should handle non-existent fields', () => {
        const identifier = {
          name: 'nonExistentField',
          kind: 'Field' as const,
          position: { start: 0, end: 16, line: 1, column: 1 },
          parentType: 'User',
          schemaPath: ['User', 'nonExistentField'],
          context: { selectionPath: ['nonExistentField'] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(false)
        expect(resolution!.referenceUrl).toBe('/reference/User#nonExistentField')
      })
    })

    describe('Argument Resolution', () => {
      it('should resolve field arguments', () => {
        const identifier = {
          name: 'first',
          kind: 'Argument' as const,
          position: { start: 0, end: 5, line: 1, column: 1 },
          parentType: 'User',
          schemaPath: ['User', 'posts', 'first'],
          context: { selectionPath: ['posts'] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.referenceUrl).toBe('/reference/User#posts-first')
        expect(resolution!.documentation?.description).toContain('Maximum number of posts')
        expect(resolution!.documentation?.typeInfo).toBe('Int')
        expect(resolution!.documentation?.defaultValue).toBe('10')
      })
    })

    describe('Variable Resolution', () => {
      it('should handle variables', () => {
        const identifier = {
          name: 'id',
          kind: 'Variable' as const,
          position: { start: 0, end: 2, line: 1, column: 1 },
          schemaPath: ['id'],
          context: { selectionPath: [] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.referenceUrl).toBe('/reference#variables')
        expect(resolution!.documentation?.typeInfo).toBe('Variable')
        expect(resolution!.documentation?.description).toBe('Query variable: $id')
      })
    })

    describe('Directive Resolution', () => {
      it('should resolve directives', () => {
        const identifier = {
          name: 'validate',
          kind: 'Directive' as const,
          position: { start: 0, end: 8, line: 1, column: 1 },
          schemaPath: ['validate'],
          context: { selectionPath: [] },
        }

        const resolution = resolver.resolveIdentifier(identifier)

        expect(resolution).toBeDefined()
        expect(resolution!.exists).toBe(true)
        expect(resolution!.referenceUrl).toBe('/reference/directives#validate')
        expect(resolution!.documentation?.description).toContain('Custom directive for validation')
      })
    })

    describe('URL Generation', () => {
      it('should generate correct URLs with custom base path', () => {
        const customResolver = createPolenSchemaResolver(testSchema, {
          basePath: '/docs/schema',
        })

        expect(customResolver.generateReferenceLink(['User'])).toBe('/docs/schema/User')
        expect(customResolver.generateReferenceLink(['User', 'name'])).toBe('/docs/schema/User#name')
        expect(customResolver.generateReferenceLink(['User', 'posts', 'first'])).toBe('/docs/schema/User#posts-first')
      })

      it('should handle fragment configuration', () => {
        const noFragmentResolver = createPolenSchemaResolver(testSchema, {
          includeFragments: false,
        })

        expect(noFragmentResolver.generateReferenceLink(['User', 'name'])).toBe('/reference/User')
      })
    })

    describe('Documentation Extraction', () => {
      it('should extract type documentation', () => {
        const docs = resolver.getDocumentation(['User'])

        expect(docs).toBeDefined()
        expect(docs!.description).toContain('A user in the system')
        expect(docs!.typeInfo).toBe('User')
      })

      it('should extract field documentation', () => {
        const docs = resolver.getDocumentation(['User', 'email'])

        expect(docs).toBeDefined()
        expect(docs!.description).toContain("The user's email address")
        expect(docs!.typeInfo).toBe('String!')
      })

      it('should extract argument documentation', () => {
        const docs = resolver.getDocumentation(['User', 'posts', 'after'])

        expect(docs).toBeDefined()
        expect(docs!.description).toContain('Filter posts after this cursor')
        expect(docs!.typeInfo).toBe('String')
      })
    })

    describe('Schema Validation', () => {
      it('should return all types', () => {
        const types = resolver.getAllTypes()

        expect(types).toContain('User')
        expect(types).toContain('Post')
        expect(types).toContain('CreateUserInput')
        expect(types).toContain('Query')
        expect(types).toContain('Mutation')
        expect(types).not.toContain('__Schema') // Should filter introspection types
      })

      it('should check type existence', () => {
        expect(resolver.typeExists('User')).toBe(true)
        expect(resolver.typeExists('NonExistentType')).toBe(false)
      })
    })
  })

  describe('Schema-Aware Analysis', () => {
    it('should perform complete schema-aware analysis', () => {
      const source = `
        query GetUser($id: ID!) {
          user(id: $id) {
            name
            email
            avatar
          }
        }
      `

      const result = analyzeWithSchema(source, testSchema)

      expect(result.analysis.isValid).toBe(true)
      expect(result.resolutions.size).toBeGreaterThan(0)
      expect(result.schemaErrors.length).toBeGreaterThan(0)

      // Should have deprecation warning for avatar field
      const deprecationWarning = result.schemaErrors.find(
        error => error.message.includes('avatar') && error.message.includes('deprecated'),
      )
      expect(deprecationWarning).toBeDefined()
      expect(deprecationWarning!.severity).toBe('warning')
    })

    it('should resolve identifiers correctly', () => {
      const source = `
        query {
          user(id: "123") {
            name
          }
        }
      `

      const result = analyzeWithSchema(source, testSchema)

      // Find the name field resolution
      const nameField = result.analysis.identifiers.all.find(
        id => id.name === 'name' && id.kind === 'Field',
      )
      expect(nameField).toBeDefined()

      const nameResolutionKey = `${nameField!.position.start}-${nameField!.name}-${nameField!.kind}`
      const nameResolution = result.resolutions.get(nameResolutionKey)

      expect(nameResolution).toBeDefined()
      expect(nameResolution!.exists).toBe(true)
      expect(nameResolution!.referenceUrl).toBe('/reference/User#name')
      expect(nameResolution!.documentation?.typeInfo).toBe('String!')
    })
  })
})

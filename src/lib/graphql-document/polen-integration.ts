/**
 * Polen Integration for GraphQL Document Component
 *
 * Provides hooks into Polen's build pipeline to enable interactive
 * GraphQL code blocks throughout the documentation.
 */

import { polenVirtual } from '#api/vite/vi'
import type { GraphQLSchema } from 'graphql'
import type { Plugin as VitePlugin } from 'vite'
import { type RehypeGraphQLOptions, rehypeGraphQLSimple } from './rehype-plugin-simple.ts'
import { analyzeWithSchema } from './schema-integration.ts'

/**
 * Configuration for Polen GraphQL integration
 */
export interface PolenGraphQLIntegrationConfig {
  /**
   * Whether to enable the integration
   * @default true
   */
  enabled?: boolean

  /**
   * GraphQL schema to use for validation and linking
   * This will be provided by Polen's schema loading system
   */
  schema?: GraphQLSchema

  /**
   * Base path for reference links
   * @default '/reference'
   */
  referencePath?: string

  /**
   * Whether to validate GraphQL documents at build time
   * @default true
   */
  validateAtBuildTime?: boolean

  /**
   * Whether to fail the build on GraphQL errors
   * @default false
   */
  failOnError?: boolean

  /**
   * Custom options for the rehype plugin
   */
  rehypeOptions?: Partial<RehypeGraphQLOptions>
}

/**
 * Virtual module for providing schema context to components
 */
const viGraphQLSchema = polenVirtual(['graphql', 'schema.js'], {
  allowPluginProcessing: false,
})

/**
 * Create the rehype plugin configuration for Polen
 */
export function createPolenRehypePlugin(config: PolenGraphQLIntegrationConfig = {}) {
  const {
    enabled = true,
    rehypeOptions = {},
  } = config

  if (!enabled) {
    return rehypeGraphQLSimple({ disabled: true }) as any
  }

  return rehypeGraphQLSimple({
    componentName: 'GraphQLDocument',
    importSource: '#lib/graphql-document/components/GraphQLDocument',
    ...rehypeOptions,
  }) as any
}

/**
 * Create Vite plugin for GraphQL document integration
 */
export function createPolenGraphQLPlugin(config: PolenGraphQLIntegrationConfig = {}): VitePlugin {
  const {
    enabled = true,
    schema,
    referencePath = '/reference',
    validateAtBuildTime = true,
    failOnError = false,
  } = config

  return {
    name: 'polen:graphql-document',
    enforce: 'pre',

    resolveId(id) {
      if (id === 'polen/graphql-document') {
        return 'virtual:polen/graphql-document'
      }
      if (id === viGraphQLSchema.id) {
        return viGraphQLSchema.id
      }
    },

    load(id) {
      // Provide the GraphQL document component module
      if (id === 'virtual:polen/graphql-document') {
        return `
          export { GraphQLDocument } from 'polen/lib/graphql-document/components/GraphQLDocument'
          export { graphqlDocumentStyles } from 'polen/lib/graphql-document/components/GraphQLDocument'
        `
      }

      // Provide schema context
      if (id === viGraphQLSchema.id && schema) {
        return `
          import { buildSchema } from 'graphql'
          
          // Export the schema for use in components
          export const schema = buildSchema(\`${schema}\`)
        `
      }
    },

    transform(code, id) {
      // Validate GraphQL in markdown files during build
      if (validateAtBuildTime && schema && (id.endsWith('.md') || id.endsWith('.mdx'))) {
        const errors: string[] = []

        // Extract GraphQL code blocks
        const graphqlBlockRegex = /```graphql\s*(.*?)\n([\s\S]*?)```/g
        let match

        while ((match = graphqlBlockRegex.exec(code)) !== null) {
          const options = match[1] || ''
          const source = match[2] || ''

          // Skip validation if plain mode
          if (options.includes('plain')) continue

          try {
            const result = analyzeWithSchema(source, schema)

            if (!result.analysis.isValid && failOnError) {
              errors.push(`Invalid GraphQL in ${id}:\n${result.analysis.errors.map(e => e.message).join('\n')}`)
            }
          } catch (error) {
            if (failOnError) {
              errors.push(`Failed to parse GraphQL in ${id}: ${error}`)
            }
          }
        }

        if (errors.length > 0) {
          throw new Error(`GraphQL validation errors:\n${errors.join('\n\n')}`)
        }
      }
    },
  }
}

/**
 * Schema provider component for wrapping the Polen app
 */
export const GraphQLSchemaProvider = `
import React from 'react'
import { schema } from 'virtual:polen/graphql/schema'

export const GraphQLSchemaContext = React.createContext(schema)

export function GraphQLSchemaProvider({ children }) {
  return (
    <GraphQLSchemaContext.Provider value={schema}>
      {children}
    </GraphQLSchemaContext.Provider>
  )
}

export function useGraphQLSchema() {
  const schema = React.useContext(GraphQLSchemaContext)
  if (!schema) {
    throw new Error('useGraphQLSchema must be used within GraphQLSchemaProvider')
  }
  return schema
}
`

/**
 * Instructions for integrating with Polen
 */
export const integrationInstructions = `
To integrate the GraphQL Document component with Polen:

1. Add the rehype plugin to your MDX configuration:

   import { createPolenRehypePlugin } from 'polen/lib/graphql-document/polen-integration'
   
   // In your MDX config
   rehypePlugins: [
     createPolenRehypePlugin({
       schema: yourGraphQLSchema,
       validateAtBuildTime: true,
     })
   ]

2. Add the Vite plugin to your Vite configuration:

   import { createPolenGraphQLPlugin } from 'polen/lib/graphql-document/polen-integration'
   
   // In your Vite config
   plugins: [
     createPolenGraphQLPlugin({
       schema: yourGraphQLSchema,
       referencePath: '/reference',
     })
   ]

3. Use GraphQL code blocks in your markdown:

   \`\`\`graphql
   query GetUser {
     user {
       id
       name
     }
   }
   \`\`\`

   Options:
   - \`\`\`graphql plain\`\`\` - Disable interactive features
   - \`\`\`graphql debug\`\`\` - Show debug overlays
   - \`\`\`graphql validate=false\`\`\` - Disable validation
`

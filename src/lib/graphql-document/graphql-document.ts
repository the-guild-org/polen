/**
 * GraphQL Document Component Library
 *
 * Transform static GraphQL code blocks into interactive documentation with
 * hyperlinks, tooltips, and schema validation.
 *
 * ## Features
 * - Hyperlinked identifiers that navigate to reference documentation
 * - Hover tooltips showing type information and descriptions
 * - Schema validation with error highlighting
 * - Build-time GraphQL validation
 * - Support for all GraphQL operations (queries, mutations, subscriptions, fragments)
 *
 * ## Usage
 * ```typescript
 * import { GraphQLDocument } from 'polen/lib/graphql-document'
 *
 * <GraphQLDocument schema={schema}>
 *   {`query { user { name } }`}
 * </GraphQLDocument>
 * ```
 *
 * @see {@link createPolenRehypePlugin} for MDX integration
 * @see {@link GraphQLDocument} for the main React component
 */

export * from './analysis.ts'
export * from './components/index.ts'
export * from './polen-integration.ts'
export * from './positioning-simple.ts'
export * from './rehype-plugin-simple.ts'
export * from './schema-integration.ts'
export * from './types.ts'

// Re-export key functions for convenience
export { analyze, analyzer, extractIdentifiers } from './analysis.ts'
export { GraphQLDocument } from './components/GraphQLDocument.tsx'
export { createPolenGraphQLPlugin, createPolenRehypePlugin } from './polen-integration.ts'
export { createSimpleOverlay, createSimplePositionCalculator } from './positioning-simple.ts'
export { createRehypeGraphQLSimple, rehypeGraphQLSimple } from './rehype-plugin-simple.ts'
export { analyzeWithSchema, createPolenSchemaResolver } from './schema-integration.ts'

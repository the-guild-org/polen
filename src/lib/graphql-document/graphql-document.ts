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
 * @see {@link GraphQLDocumentWithSchema} for MDX integration
 * @see {@link GraphQLDocument} for the main React component
 */

export * from './analysis.js'
export * from './components/index.js'
export * from './positioning-simple.js'
export * from './schema-integration.js'
export * from './types.js'

// Re-export key functions for convenience
export { analyze, analyzer, extractIdentifiers } from './analysis.js'
export { GraphQLDocument } from './components/GraphQLDocument.js'
export { createSimpleOverlay, createSimplePositionCalculator } from './positioning-simple.js'
export { analyzeWithSchema, createPolenSchemaResolver } from './schema-integration.js'

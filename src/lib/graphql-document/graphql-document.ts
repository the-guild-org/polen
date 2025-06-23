/**
 * GraphQL Document Analysis Library
 *
 * Provides tools for analyzing GraphQL documents to extract identifiers,
 * positions, and context information for interactive documentation features.
 *
 * This is the foundation layer for the GraphQL Document Component that will
 * transform static GraphQL code blocks into hyperlinked, interactive documentation.
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

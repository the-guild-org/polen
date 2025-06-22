/**
 * GraphQL Document Analysis Library
 * 
 * Provides tools for analyzing GraphQL documents to extract identifiers,
 * positions, and context information for interactive documentation features.
 * 
 * This is the foundation layer for the GraphQL Document Component that will
 * transform static GraphQL code blocks into hyperlinked, interactive documentation.
 */

export * from './types.ts'
export * from './analysis.ts'

// Re-export key functions for convenience
export { analyze, extractIdentifiers, analyzer } from './analysis.ts'
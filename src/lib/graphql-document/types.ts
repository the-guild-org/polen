import type { DocumentNode, GraphQLSchema, GraphQLError } from 'graphql'

/**
 * Represents a GraphQL identifier found in a document
 */
export interface Identifier {
  /** The name of the identifier (e.g., 'User', 'name', 'id') */
  name: string
  /** The kind of GraphQL construct this identifier represents */
  kind: 'Type' | 'Field' | 'Argument' | 'Directive' | 'Variable' | 'Fragment'
  /** Position information in the source document */
  position: {
    /** Character offset from start of document */
    start: number
    /** Character offset for end of identifier */
    end: number
    /** Line number (1-based) */
    line: number
    /** Column number (1-based) */
    column: number
  }
  /** The parent type name if this is a field or argument */
  parentType?: string
  /** Path through the schema to this identifier (e.g., ['User', 'posts', 'title']) */
  schemaPath: string[]
  /** Context about where this identifier appears */
  context: IdentifierContext
}

/**
 * Additional context about where an identifier appears in the document
 */
export interface IdentifierContext {
  /** The operation type if this identifier is within an operation */
  operationType?: 'query' | 'mutation' | 'subscription'
  /** The operation name if this identifier is within a named operation */
  operationName?: string
  /** Whether this identifier is in a fragment definition */
  inFragment?: string
  /** The selection path leading to this identifier */
  selectionPath: string[]
}

/**
 * Map of all identifiers found in a GraphQL document
 */
export interface IdentifierMap {
  /** Quick lookup by character position */
  byPosition: Map<number, Identifier>
  /** Grouped by identifier kind for easy filtering */
  byKind: Map<Identifier['kind'], Identifier[]>
  /** Any validation errors found during analysis */
  errors: AnalysisError[]
  /** All identifiers as a flat array */
  all: Identifier[]
}

/**
 * Analysis error with context about the identifier that caused it
 */
export interface AnalysisError {
  /** The identifier that caused the error (if applicable) */
  identifier?: Identifier
  /** Human-readable error message */
  message: string
  /** Error severity level */
  severity: 'error' | 'warning' | 'info'
  /** Position in the document where the error occurred */
  position?: {
    line: number
    column: number
  }
}

/**
 * Result of analyzing a GraphQL document
 */
export interface AnalysisResult {
  /** The parsed AST */
  ast: DocumentNode
  /** Map of all identifiers found */
  identifiers: IdentifierMap
  /** Whether the document parsed successfully */
  isValid: boolean
  /** Any parse or validation errors */
  errors: GraphQLError[]
}

/**
 * Configuration for GraphQL document analysis
 */
export interface AnalysisConfig {
  /** Whether to include position information for identifiers */
  includePositions?: boolean
  /** Whether to validate against a schema (if provided) */
  validateAgainstSchema?: boolean
  /** Schema to validate against */
  schema?: GraphQLSchema
  /** Whether to extract fragment information */
  includeFragments?: boolean
}

/**
 * Interface for the main GraphQL analyzer
 */
export interface GraphQLAnalyzer {
  /**
   * Parse a GraphQL document string into an AST
   */
  parse(source: string): DocumentNode

  /**
   * Extract all identifiers from a GraphQL AST
   */
  extractIdentifiers(ast: DocumentNode, config?: AnalysisConfig): IdentifierMap

  /**
   * Validate a GraphQL document against a schema
   */
  validateAgainstSchema(
    ast: DocumentNode,
    schema: GraphQLSchema
  ): GraphQLError[]

  /**
   * Perform complete analysis of a GraphQL document
   */
  analyze(source: string, config?: AnalysisConfig): AnalysisResult
}
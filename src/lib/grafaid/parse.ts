import { Effect } from 'effect'
import { type DocumentNode, Kind, parse as graphqlParse } from 'graphql'
import { makeParseError, ParseError } from './parse-error.js'

/**
 * Parse GraphQL source text into an AST.
 *
 * This is the centralized parsing function that should be used throughout
 * the codebase for parsing any GraphQL content (schemas or documents).
 *
 * @param source - The GraphQL source text to parse
 * @param options - Optional parsing configuration
 * @returns An Effect that yields a DocumentNode AST or fails with ParseError
 *
 * @example
 * ```ts
 * // Parse a schema
 * const schemaAst = yield* parse(schemaSDL, {
 *   parseType: 'schema',
 *   source: 'schema.graphql'
 * })
 *
 * // Parse a query document
 * const queryAst = yield* parse(queryString, {
 *   parseType: 'document',
 *   source: 'getUserQuery'
 * })
 * ```
 */
export const parse = (
  source: string,
  options?: {
    /**
     * The type of content being parsed.
     * Helps provide better error messages.
     */
    parseType?: 'schema' | 'document' | 'unknown'

    /**
     * Optional source identifier for debugging.
     * Could be a file path, URL, or descriptive name.
     */
    source?: string
  },
): Effect.Effect<DocumentNode, ParseError> =>
  Effect.try({
    try: () => graphqlParse(source),
    catch: (error) => {
      // Extract useful error information
      let message = 'Failed to parse GraphQL'
      let excerpt: string | undefined

      if (error instanceof Error) {
        message = error.message

        // GraphQL parse errors often include location info
        // Try to extract a meaningful excerpt if possible
        if ('locations' in error && Array.isArray(error.locations) && error.locations.length > 0) {
          const location = error.locations[0]
          if (location && typeof location.line === 'number') {
            const lines = source.split('\n')
            const errorLine = lines[location.line - 1]
            if (errorLine) {
              excerpt = `Line ${location.line}: ${errorLine.trim()}`
            }
          }
        }
      }

      const parseType = options?.parseType ?? inferParseType(source)

      const errorOptions: Parameters<typeof makeParseError>[1] = {
        parseType,
        cause: error,
      }

      if (options?.source) {
        errorOptions.source = options.source
      }

      if (excerpt) {
        errorOptions.excerpt = excerpt
      }

      return makeParseError(
        `Failed to parse GraphQL ${parseType}${options?.source ? ` from ${options.source}` : ''}: ${message}`,
        errorOptions,
      )
    },
  })

/**
 * Parse GraphQL schema SDL with typed errors.
 *
 * This is a specialized version of parse() that's explicitly for schemas.
 *
 * @param source - The GraphQL schema SDL to parse
 * @param options - Optional parsing configuration
 * @returns An Effect that yields a DocumentNode AST or fails with ParseError
 */
export const parseSchema = (
  source: string,
  options?: {
    source?: string
  },
): Effect.Effect<DocumentNode, ParseError> =>
  parse(source, {
    parseType: 'schema',
    ...options,
  })

/**
 * Parse GraphQL document (query/mutation/subscription) with typed errors.
 *
 * This is a specialized version of parse() that's explicitly for executable documents.
 *
 * @param source - The GraphQL document to parse
 * @param options - Optional parsing configuration
 * @returns An Effect that yields a DocumentNode AST or fails with ParseError
 */
export const parseDocument = (
  source: string,
  options?: {
    source?: string
  },
): Effect.Effect<DocumentNode, ParseError> =>
  parse(source, {
    parseType: 'document',
    ...options,
  })

/**
 * Try to infer whether the source is a schema or document.
 * This is a best-effort heuristic and may not always be accurate.
 */
const inferParseType = (source: string): 'schema' | 'document' | 'unknown' => {
  // Common schema definition keywords
  const schemaKeywords = /^\s*(type|interface|enum|scalar|union|input|schema|extend|directive)\s+/m
  // Common document keywords
  const documentKeywords = /^\s*(query|mutation|subscription|fragment)\s+/m

  if (schemaKeywords.test(source)) {
    return 'schema'
  }

  if (documentKeywords.test(source)) {
    return 'document'
  }

  // Check for anonymous query syntax { ... }
  if (/^\s*\{/.test(source)) {
    return 'document'
  }

  return 'unknown'
}

/**
 * Create an empty DocumentNode.
 * Useful for representing an absence of GraphQL content.
 */
export const empty: DocumentNode = {
  definitions: [],
  kind: Kind.DOCUMENT,
}

import { Match } from 'effect'
import type { GraphQLError, GraphQLSchema } from 'graphql'
import { parse, specifiedRules, validate } from 'graphql'
import { DiagnosticValidationError } from './diagnostics.js'
import type { Example } from './example.js'

// ============================================================================
// Types
// ============================================================================

export type ValidationDiagnostic = DiagnosticValidationError

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate examples against a GraphQL schema.
 *
 * @param examples - The examples to validate
 * @param schema - The GraphQL schema to validate against
 * @returns Array of validation diagnostics
 */
export const validateExamples = (
  examples: Example[],
  schema: GraphQLSchema,
): ValidationDiagnostic[] => {
  console.log('[DEBUG] validateExamples called with', examples.length, 'examples')
  const diagnostics: ValidationDiagnostic[] = []

  for (const example of examples) {
    Match.value(example).pipe(
      Match.when({ _tag: 'ExampleVersioned' }, (e) => {
        // Validate each version document
        for (const [version, content] of Object.entries(e.versionDocuments)) {
          validateDocument(e.name, e.path, version, content, schema, diagnostics)
        }
        // Also validate default document if present
        if (e.defaultDocument) {
          validateDocument(e.name, e.path, 'default', e.defaultDocument, schema, diagnostics)
        }
      }),
      Match.when({ _tag: 'ExampleUnversioned' }, (e) => {
        // Validate the single document
        validateDocument(e.name, e.path, 'default', e.document, schema, diagnostics)
      }),
      Match.exhaustive,
    )
  }

  return diagnostics
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate a single document and add diagnostics if needed.
 */
const validateDocument = (
  exampleName: string,
  examplePath: string,
  version: string,
  content: string,
  schema: GraphQLSchema,
  diagnostics: ValidationDiagnostic[],
): void => {
  try {
    // Parse the GraphQL document
    const document = parse(content)

    // Validate against the schema
    const errors = validate(schema, document, specifiedRules)
    
    console.log('[DEBUG] Validation result for', exampleName, version, ':', errors.length, 'errors')
    if (errors.length > 0) {
      console.log('[DEBUG] Errors:', errors.map(e => e.message))
    }

    if (errors.length > 0) {
      diagnostics.push(DiagnosticValidationError.make({
        message: formatValidationMessage(exampleName, version, errors),
        example: { id: exampleName, path: examplePath },
        version,
        errors: errors.map(formatGraphQLError),
      } as any))
    }
  } catch (parseError) {
    // Parse errors are also validation errors
    diagnostics.push(DiagnosticValidationError.make({
      message: `Example "${exampleName}" (${version}) has invalid GraphQL syntax`,
      example: { id: exampleName, path: examplePath },
      version,
      errors: [{ message: String(parseError) }],
    } as any))
  }
}

/**
 * Format a validation message for an example.
 */
const formatValidationMessage = (
  exampleId: string,
  version: string,
  errors: readonly GraphQLError[],
): string => {
  const versionStr = version === 'default' ? '' : ` (${version})`
  const errorCount = errors.length
  const errorWord = errorCount === 1 ? 'error' : 'errors'

  // Include the first error message for context
  const firstError = errors[0]
  const preview = firstError ? `: ${firstError.message}` : ''

  return `Example "${exampleId}"${versionStr} has ${errorCount} validation ${errorWord}${preview}`
}

/**
 * Format a GraphQL error for diagnostic reporting.
 */
const formatGraphQLError = (error: GraphQLError): {
  message: string
  locations?: Array<{ line: number; column: number }>
} => ({
  message: error.message,
  ...(error.locations
    ? {
      locations: error.locations.map(loc => ({
        line: loc.line,
        column: loc.column,
      })),
    }
    : {}),
})

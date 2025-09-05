import { Catalog as SchemaCatalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { Version } from '#lib/version/$'
import { Match } from 'effect'
import { HashMap } from 'effect/Schema'
import type { GraphQLError, GraphQLSchema } from 'graphql'
import { parse, specifiedRules, validate } from 'graphql'
import { Example } from '../schemas/example/$.js'
import type { DiagnosticValidationError } from './diagnostic.js'
import { makeDiagnosticValidationError } from './diagnostic.js'

// ============================================================================
// Types
// ============================================================================

export type ValidationDiagnostic = DiagnosticValidationError

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate examples against a schema catalog.
 *
 * @param examples - The examples to validate
 * @param catalog - The schema catalog containing versioned or unversioned schemas
 * @returns Array of validation diagnostics
 */
export const validateExamples = (
  examples: Example.Example[],
  catalog: SchemaCatalog.Catalog,
): ValidationDiagnostic[] => {
  const diagnostics: ValidationDiagnostic[] = []

  return Match.value(catalog).pipe(
    Match.tagsExhaustive({
      CatalogVersioned: (versioned) => {
        for (const example of examples) {
          Match.value(example.document).pipe(
            Match.tagsExhaustive({
              DocumentVersioned: (doc) => {
                // Validate each version against its corresponding schema
                for (const schema of SchemaCatalog.Versioned.getAll(versioned)) {
                  const content = Document.Versioned.getContentForVersion(doc, schema.version)
                  if (content) {
                    const versionStr = Version.encodeSync(schema.version)
                    validateDocument(
                      example.name,
                      example.path,
                      versionStr,
                      content,
                      schema.definition,
                      diagnostics,
                    )
                  }
                }
                return undefined
              },
              DocumentUnversioned: (doc) => {
                const latestEntry = SchemaCatalog.Versioned.getLatestOrThrow(versioned)
                validateDocument(
                  example.name,
                  example.path,
                  'default',
                  doc.document,
                  latestEntry.definition,
                  diagnostics,
                )
                return undefined
              },
            }),
          )
        }

        return diagnostics
      },
      CatalogUnversioned: (unversioned) => {
        // For unversioned catalog, only unversioned documents make sense
        for (const example of examples) {
          if (example.document._tag === 'DocumentUnversioned') {
            validateDocument(
              example.name,
              example.path,
              'default',
              example.document.document,
              unversioned.schema.definition,
              diagnostics,
            )
          }
          // Versioned/PartiallyVersioned documents with unversioned catalog don't make sense
          // These should be caught by other diagnostics
        }

        return diagnostics
      },
    }),
  )
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

    if (errors.length > 0) {
      diagnostics.push(makeDiagnosticValidationError({
        message: formatValidationMessage(exampleName, version, errors),
        example: { name: exampleName, path: examplePath },
        version,
        errors: errors.map(formatGraphQLError),
      }))
    }
  } catch (parseError) {
    // Parse errors are also validation errors
    diagnostics.push(makeDiagnosticValidationError({
      message: `Example "${exampleName}" (${version}) has invalid GraphQL syntax`,
      example: { name: exampleName, path: examplePath },
      version,
      errors: [{ message: String(parseError) }],
    }))
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

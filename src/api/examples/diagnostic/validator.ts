import { Ar, Ei } from '#dep/effect'
import { Match, Schema as S } from 'effect'
import type { DocumentNode, GraphQLError } from 'graphql'
import { parse, specifiedRules, validate } from 'graphql'
import { Catalog as SchemaCatalog, Document, Schema, Version, VersionCoverage } from 'graphql-kit'
import { Example } from '../schemas/example/$.js'
import type { DiagnosticValidationError } from './diagnostic.js'
import { makeDiagnosticValidationError } from './diagnostic.js'

// ============================================================================
// Types
// ============================================================================

export type ValidationDiagnostic = DiagnosticValidationError

// ============================================================================
// Schemas
// ============================================================================

const GraphQLErrorData = S.Struct({
  message: S.String,
  locations: S.optional(S.Array(S.Struct({
    line: S.Number,
    column: S.Number,
  }))),
})

type GraphQLErrorData = typeof GraphQLErrorData.Type

// ============================================================================
// Safe Parsing
// ============================================================================

/**
 * Safely parse a GraphQL document without throwing.
 * Returns an Either with the document on success or error on failure.
 */
const parseDocumentSafe = (content: string): Ei.Either<DocumentNode, GraphQLError> => {
  return Ei.try({
    try: () => parse(content),
    catch: (error) => error as GraphQLError,
  })
}

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

  Ar.forEach(examples, (example) => {
    if (example.document._tag === 'DocumentVersioned') {
      // Versioned document: iterate all versions and let utility handle compatibility
      const documentVersions = Document.Versioned.getAllVersions(example.document)
      let versionMismatchDetected = false

      Ar.forEach(documentVersions, (version) => {
        // Skip remaining versions if we already detected a version mismatch
        if (versionMismatchDetected) return

        const result = Document.resolveDocumentAndSchema(
          example.document,
          catalog,
          VersionCoverage.One.make({ version }), // Pass each version as VersionCoverage
        )

        Ei.match(result, {
          onLeft: (error) => {
            // Pattern match on error types - all errors are now tagged
            Match.value(error).pipe(
              Match.when({ _tag: 'VersionCoverageMismatchError' }, (err) => {
                diagnostics.push(makeDiagnosticValidationError({
                  message: `Example "${example.name}" has versioned content but catalog is unversioned`,
                  example: { name: example.name, path: example.path },
                  version: undefined,
                  errors: [{ message: err.reason }],
                }))
                // Set flag to skip remaining versions - all will have same error
                versionMismatchDetected = true
              }),
              Match.when({ _tag: 'VersionNotFoundInDocumentError' }, () => {
                // Skip silently - version not found in document
              }),
              Match.when({ _tag: 'VersionNotFoundInCatalogError' }, () => {
                // Skip silently - version not found in catalog
              }),
              Match.when({ _tag: 'EmptyCatalogError' }, () => {
                // Skip silently - catalog has no entries
              }),
              Match.exhaustive,
            )
          },
          onRight: ({ content, schema }) => {
            if (schema) {
              validateDocument(example, schema, content, diagnostics)
            }
          },
        })
      })
    } else {
      // Unversioned document: call without version coverage
      const result = Document.resolveDocumentAndSchema(
        example.document,
        catalog,
      )

      Ei.match(result, {
        onLeft: () => {
          // Resolution failed - skip silently
        },
        onRight: ({ content, schema }) => {
          if (schema) {
            validateDocument(example, schema, content, diagnostics)
          }
        },
      })
    }
  })

  return diagnostics
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate a single document and add diagnostics if needed.
 */
const validateDocument = (
  example: Example.Example,
  schema: Schema.Schema,
  content: string,
  diagnostics: ValidationDiagnostic[],
): void => {
  // Extract version from schema (undefined for unversioned)
  const version = Schema.getVersion(schema)

  // Parse the document safely
  const parseResult = parseDocumentSafe(content)

  if (Ei.isLeft(parseResult)) {
    // Handle parse errors
    diagnostics.push(makeDiagnosticValidationError({
      message: formatParseError(example.name, version),
      example: { name: example.name, path: example.path },
      version,
      errors: [{ message: parseResult.left.message }],
    }))
    return
  }

  // Validate the parsed document against the schema
  const errors = validate(schema.definition, parseResult.right, specifiedRules)

  if (Ar.isNonEmptyReadonlyArray(errors)) {
    diagnostics.push(makeDiagnosticValidationError({
      message: formatValidationMessage(example.name, version, errors),
      example: { name: example.name, path: example.path },
      version,
      errors: errors.map(formatGraphQLError),
    }))
  }
}

/**
 * Format a parse error message for an example.
 */
const formatParseError = (
  exampleId: string,
  version: Version.Version | undefined,
): string => {
  const versionStr = version ? ` (${Version.encodeSync(version)})` : ''
  return `Example "${exampleId}"${versionStr} has invalid GraphQL syntax`
}

/**
 * Format a validation message for an example.
 */
const formatValidationMessage = (
  exampleId: string,
  version: Version.Version | undefined,
  errors: Ar.NonEmptyReadonlyArray<GraphQLError>,
): string => {
  const versionStr = version ? ` (${Version.encodeSync(version)})` : ''
  const errorCount = errors.length
  const errorWord = errorCount === 1 ? 'error' : 'errors'

  // Include the first error message for context - always safe with NonEmptyArray
  const firstError = Ar.headNonEmpty(errors)
  const preview = `: ${firstError.message}`

  return `Example "${exampleId}"${versionStr} has ${errorCount} validation ${errorWord}${preview}`
}

/**
 * Format a GraphQL error for diagnostic reporting.
 */
const formatGraphQLError = (error: GraphQLError): GraphQLErrorData =>
  GraphQLErrorData.make({
    message: error.message,
    ...(error.locations && {
      locations: error.locations.map(loc => ({
        line: loc.line,
        column: loc.column,
      })),
    }),
  })

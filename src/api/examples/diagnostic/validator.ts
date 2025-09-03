import { Catalog as SchemaCatalog } from '#lib/catalog/$'
import { Version } from '#lib/version/$'
import { HashMap, Match, Option } from 'effect'
import { Array } from 'effect'
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
        const schemaVersions = versioned.entries.map(e => e.version)

        for (const example of examples) {
          Match.value(example).pipe(
            Match.tagsExhaustive({
              ExampleVersioned: (e) => {
                // Fully versioned - validate each version against its corresponding schema
                for (const entry of versioned.entries) {
                  const content = HashMap.get(e.versionDocuments, entry.version)
                  if (Option.isSome(content)) {
                    const versionStr = Version.toString(entry.version)
                    validateDocument(e.name, e.path, versionStr, content.value, entry.definition, diagnostics)
                  }
                }
              },
              ExamplePartiallyVersioned: (e) => {
                // Validate explicit versions against their corresponding schemas
                for (const entry of versioned.entries) {
                  const content = HashMap.get(e.versionDocuments, entry.version)
                  if (Option.isSome(content)) {
                    const versionStr = Version.toString(entry.version)
                    validateDocument(e.name, e.path, versionStr, content.value, entry.definition, diagnostics)
                  }
                }

                const uncoveredVersions = Array.filter(schemaVersions, (v) => !HashMap.has(e.versionDocuments, v))

                for (const uncoveredVersion of uncoveredVersions) {
                  const entry = versioned.entries.find(
                    e => Version.equivalence(e.version, uncoveredVersion),
                  )
                  if (!entry) throw new Error('Uncovered version not found in catalog entries')
                  validateDocument(e.name, e.path, 'default', e.defaultDocument, entry.definition, diagnostics)
                }
              },
              ExampleUnversioned: (e) => {
                const latestEntry = versioned.entries[0]!
                validateDocument(e.name, e.path, 'default', e.document, latestEntry.definition, diagnostics)
              },
            }),
          )
        }

        return diagnostics
      },
      CatalogUnversioned: (unversioned) => {
        // For unversioned catalog, only unversioned examples make sense
        for (const example of examples) {
          if (example._tag === 'ExampleUnversioned') {
            validateDocument(
              example.name,
              example.path,
              'default',
              example.document,
              unversioned.schema.definition,
              diagnostics,
            )
          }
          // Versioned/PartiallyVersioned examples with unversioned catalog don't make sense
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

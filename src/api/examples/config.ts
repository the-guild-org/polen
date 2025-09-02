import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Global Interface for Type Augmentation
// ============================================================================

declare global {
  namespace PolenGlobal {
    /**
     * Global interface for type-safe example selection.
     * This interface is augmented by the type generator with discovered example names.
     */
    interface Examples {
      /**
       * Fallback generic example names for when types haven't been generated yet.
       * This allows the code to compile even without generated types.
       */
      readonly namesGeneric: readonly string[]
    }
  }
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Get example names with fallback to generic if not generated yet.
 * Prefers the generated 'names' property if it exists, otherwise falls back to 'namesGeneric'.
 */
export type GetExampleNames<$Examples = PolenGlobal.Examples> = $Examples extends { names: infer N } ? N
  : $Examples extends { namesGeneric: infer G } ? G
  : never

/**
 * Type-safe example names that work with or without generation.
 */
export type AvailableExampleNames = GetExampleNames

// ============================================================================
// Schema - Example Selection
// ============================================================================

/**
 * Schema for example names that provides type-safety at compile time
 * while accepting any string at runtime for flexibility.
 */
export const ExampleName = S.transform(
  S.String,
  S.String.pipe(S.annotations({
    identifier: 'ExampleName',
    description: 'Name of an example',
  })),
  {
    strict: false,
    decode: (s) => s as any as AvailableExampleNames,
    encode: (s) => s,
  },
)

export type ExampleName = S.Schema.Type<typeof ExampleName>

/**
 * Example selection configuration supporting both include and exclude patterns.
 */
export const ExampleSelection = S.optional(
  S.Union(
    S.Literal('all'),
    S.Literal('none'),
    S.Struct({
      /**
       * Examples to include. If specified, only these examples will be shown.
       */
      include: S.Array(ExampleName),
    }).annotations({
      identifier: 'ExampleSelectionInclude',
      description: 'Include specific examples',
    }),
    S.Struct({
      /**
       * Examples to exclude. All other examples will be shown.
       */
      exclude: S.Array(ExampleName),
    }).annotations({
      identifier: 'ExampleSelectionExclude',
      description: 'Exclude specific examples',
    }),
  ),
).annotations({
  identifier: 'ExampleSelection',
  title: 'Example Selection',
  description: 'Configuration for selecting which examples to display',
})

export type ExampleSelection = S.Schema.Type<typeof ExampleSelection>

// ============================================================================
// Schema - Example Diagnostics
// ============================================================================

/**
 * Diagnostic controls for example scanning and validation.
 */
const ExampleDiagnostics = S.Struct({
  /**
   * Control validation of GraphQL documents against the schema.
   *
   * @default true (warns in dev, errors in build)
   */
  validation: S.optional(S.Union(S.Boolean, Diagnostic.Control)),

  /**
   * Control warnings about unused default versions when versioned files exist.
   *
   * @default true (info in dev, warning in build)
   */
  unusedVersions: S.optional(S.Union(S.Boolean, Diagnostic.Control)),

  /**
   * Control detection of duplicate content across versions.
   *
   * @default true in dev only
   */
  duplicateContent: S.optional(S.Union(S.Boolean, Diagnostic.Control)),

  /**
   * Control warnings about missing versions for examples.
   *
   * @default true (info in dev, warning in build)
   */
  missingVersions: S.optional(S.Union(S.Boolean, Diagnostic.Control)),
}).annotations({
  identifier: 'ExampleDiagnostics',
  description: 'Diagnostic controls for example scanning and validation',
})

export type ExampleDiagnostics = S.Schema.Type<typeof ExampleDiagnostics>

// ============================================================================
// Schema - Examples Config
// ============================================================================

export const ExamplesConfig = S.Struct({
  /**
   * Control which examples are available in the application.
   *
   * @default 'all'
   * @example
   * ```ts
   * // Show all examples
   * examples: { display: 'all' }
   *
   * // Show no examples
   * examples: { display: 'none' }
   *
   * // Show specific examples (type-safe with generated types)
   * examples: {
   *   display: {
   *     include: ['get-user', 'create-post']
   *   }
   * }
   *
   * // Exclude specific examples
   * examples: {
   *   display: {
   *     exclude: ['advanced-filtering']
   *   }
   * }
   * ```
   */
  display: ExampleSelection,

  /**
   * Diagnostic controls for examples.
   * Can be a simple boolean for all diagnostics, or fine-grained control per diagnostic type.
   *
   * @example
   * ```ts
   * // Enable all diagnostics with defaults
   * diagnostics: {
   *   validation: true
   * }
   *
   * // Fine-grained control
   * diagnostics: {
   *   validation: {
   *     enabled: true,
   *     dev: { enabled: true, severity: 'warning' },
   *     build: { enabled: true, severity: 'error' }
   *   }
   * }
   * ```
   */
  diagnostics: S.optional(ExampleDiagnostics),
}).annotations({
  identifier: 'ExamplesConfig',
  title: 'Examples Configuration',
  description: 'Configuration for GraphQL examples behavior and diagnostics',
})

export type ExamplesConfig = S.Schema.Type<typeof ExamplesConfig>

// ============================================================================
// Constructors
// ============================================================================

export const makeExamplesConfig = ExamplesConfig.make

// ============================================================================
// Type Guards
// ============================================================================

export const isExamplesConfig = S.is(ExamplesConfig)

// ============================================================================
// Codecs
// ============================================================================

export const decodeExamplesConfig = S.decode(ExamplesConfig)
export const encodeExamplesConfig = S.encode(ExamplesConfig)

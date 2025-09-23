import { S } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'

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
    decode: (s) => s,
    encode: (s) => s,
  },
)

export type ExampleName = typeof ExampleName.Type

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

export type ExampleSelection = typeof ExampleSelection.Type

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

export type ExampleDiagnostics = typeof ExampleDiagnostics.Type

// ============================================================================
// Schema - Examples Config
// ============================================================================

export const ExamplesConfigObject = S.Struct({
  /**
   * Control whether the examples feature is enabled.
   * - true: Always enabled (show in nav even if no examples exist)
   * - false: Always disabled (hide even if examples files exist)
   * - undefined: Auto-detect based on file presence (default behavior)
   *
   * @default undefined (auto-detect)
   * @example
   * ```ts
   * // Always show examples section
   * examples: { enabled: true }
   *
   * // Never show examples
   * examples: { enabled: false }
   *
   * // Auto-detect (default)
   * examples: { /* enabled not specified *\/ }
   * ```
   */
  enabled: S.optional(S.Boolean),

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

/**
 * Examples configuration supporting both boolean shorthand and detailed object form.
 * - `false`: Disable examples entirely
 * - `true`: Enable examples with defaults
 * - object: Fine-grained configuration
 */
export const ExamplesConfig = S.transform(
  S.Union(
    S.Boolean,
    ExamplesConfigObject,
  ),
  ExamplesConfigObject,
  {
    strict: false,
    decode: (input) => {
      if (typeof input === 'boolean') {
        // Convert boolean shorthand to object form
        return input === false
          ? { enabled: false } as const
          : {} // true means use defaults
      }
      return input
    },
    encode: (value) => value,
  },
).annotations({
  identifier: 'ExamplesConfigTransform',
  title: 'Examples Configuration with Boolean Shorthand',
  description: 'Configuration for GraphQL examples - accepts boolean shorthand or detailed object',
})

export type ExamplesConfig = typeof ExamplesConfig.Type

// ============================================================================
// Constructors
export const makeExamplesConfig = ExamplesConfigObject.make

// ============================================================================
// Type Guards
// ============================================================================

export const isExamplesConfig = S.is(ExamplesConfig)

// ============================================================================
// Codecs
// ============================================================================

export const decodeExamplesConfig = S.decode(ExamplesConfig)
export const encodeExamplesConfig = S.encode(ExamplesConfig)

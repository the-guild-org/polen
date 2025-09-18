import { S } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'

// ============================================================================
// Schema - Reference Diagnostics
// ============================================================================

/**
 * Diagnostic controls for reference documentation.
 */
export const ReferenceDiagnostics = S.Struct({
  /**
   * Control diagnostics for missing or invalid reference content.
   *
   * @default true (info in dev, warning in build)
   */
  validation: S.optional(S.Union(S.Boolean, Diagnostic.Control)),
}).annotations({
  identifier: 'ReferenceDiagnostics',
  description: 'Diagnostic controls for reference documentation',
})

export type ReferenceDiagnostics = S.Schema.Type<typeof ReferenceDiagnostics>

// ============================================================================
// Schema - Descriptions View
// ============================================================================

/**
 * Configuration for how descriptions are displayed in reference documentation.
 */
export const DescriptionsView = S.Struct({
  /**
   * Default view mode for descriptions.
   * - 'expanded': Show full descriptions (default)
   * - 'compact': Show condensed view
   *
   * @default 'expanded'
   */
  defaultMode: S.optional(S.Literal('compact', 'expanded')),

  /**
   * Whether to show the view mode toggle control.
   * Allows users to switch between compact and expanded views.
   *
   * @default true
   */
  showControl: S.optional(S.Boolean),
}).annotations({
  identifier: 'DescriptionsView',
  description: 'Configuration for descriptions display in reference documentation',
})

export type DescriptionsView = S.Schema.Type<typeof DescriptionsView>

// ============================================================================
// Schema - Reference Config
// ============================================================================

export const ReferenceConfigObject = S.Struct({
  /**
   * Control whether the reference documentation is enabled.
   * - true: Always enabled (show in nav even if no schema exists)
   * - false: Always disabled (hide even if schema exists)
   * - undefined: Auto-detect based on schema presence (default behavior)
   *
   * @default undefined (auto-detect based on schema presence)
   * @example
   * // Always show reference section
   * reference: { enabled: true }
   *
   * @example
   * // Never show reference
   * reference: { enabled: false }
   *
   * @example
   * // Auto-detect based on schema (default)
   * reference: { }
   */
  enabled: S.optional(S.Boolean),

  /**
   * Configuration for how descriptions are displayed.
   *
   * @example
   * // Use compact mode by default
   * descriptionsView: {
   *   defaultMode: 'compact'
   * }
   *
   * @example
   * // Hide the view mode toggle
   * descriptionsView: {
   *   showControl: false
   * }
   */
  descriptionsView: S.optional(DescriptionsView),

  /**
   * Configuration for how field nullability is rendered.
   * - 'bangMark': Show '!' after non-nullable types (GraphQL style)
   * - 'questionMark': Show '?' after nullable field names (TypeScript style)
   *
   * @default 'bangMark'
   * @example
   * // Use TypeScript-style nullability rendering
   * nullabilityRendering: 'questionMark'
   */
  nullabilityRendering: S.optional(S.Literal('questionMark', 'bangMark')),

  /**
   * Diagnostic controls for reference documentation.
   *
   * @example
   * // Enable all diagnostics with defaults
   * diagnostics: {
   *   validation: true
   * }
   *
   * @example
   * // Fine-grained control
   * diagnostics: {
   *   validation: {
   *     enabled: true,
   *     dev: { severity: 'error' },
   *     build: { severity: 'warning' }
   *   }
   * }
   */
  diagnostics: S.optional(ReferenceDiagnostics),
}).annotations({
  identifier: 'ReferenceConfigObject',
  title: 'Reference Configuration',
  description: 'Configuration for reference documentation feature',
})

export type ReferenceConfigObject = S.Schema.Type<typeof ReferenceConfigObject>

/**
 * Reference configuration with boolean shorthand support.
 * - true: Enable with defaults
 * - false: Disable completely
 * - object: Fine-grained control
 */
export const ReferenceConfig = S.transform(
  S.Union(
    S.Boolean,
    ReferenceConfigObject,
  ),
  ReferenceConfigObject,
  {
    strict: false,
    decode: (input) => {
      if (typeof input === 'boolean') {
        return {
          enabled: input,
          descriptionsView: {},
          nullabilityRendering: undefined,
          diagnostics: {},
        }
      }
      return input
    },
    encode: (config) => config,
  },
).annotations({
  identifier: 'ReferenceConfig',
  title: 'Reference Configuration',
  description: 'Reference documentation configuration with boolean shortcuts',
})

export type ReferenceConfig = S.Schema.Type<typeof ReferenceConfig>

// ============================================================================
// Constructors
// ============================================================================

export const make = ReferenceConfigObject.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(ReferenceConfig)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(ReferenceConfig)
export const decodeSync = S.decodeSync(ReferenceConfig)
export const encode = S.encode(ReferenceConfig)
export const encodeSync = S.encodeSync(ReferenceConfig)

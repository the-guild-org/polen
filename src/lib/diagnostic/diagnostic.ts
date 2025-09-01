import { S } from '#lib/kit-temp/effect'
import * as SeverityModule from './severity.js'

// ============================================================================
// Schema - Base Diagnostic
// ============================================================================

/**
 * Base schema that all diagnostics must extend.
 *
 * This provides a three-level hierarchy for diagnostics:
 * - Level 1: `_tag: 'Diagnostic'` - Identifies any diagnostic
 * - Level 2: `source` - Which system generated the diagnostic
 * - Level 3: `name` - The specific diagnostic type
 *
 * @example
 * ```typescript
 * const MyDiagnostic = S.extend(
 *   DiagnosticBase,
 *   S.Struct({
 *     _tag: S.Literal('Diagnostic'),
 *     source: S.Literal('my-feature'),
 *     name: S.Literal('specific-error'),
 *     // ... additional fields
 *   })
 * )
 * ```
 */
export const DiagnosticBase = S.Struct({
  /**
   * Level 1: Identifies this as a diagnostic.
   * All diagnostics must have this tag.
   */
  _tag: S.Literal('Diagnostic'),

  /**
   * Level 2: Source system/feature that generated this diagnostic.
   * Examples: 'file-router', 'examples', 'schema-validator'
   */
  source: S.String,

  /**
   * Level 3: Specific diagnostic name within the source.
   * Should be kebab-case and unique within the source.
   * Examples: 'index-conflict', 'unused-default', 'missing-field'
   */
  name: S.String,

  /**
   * Severity level of the diagnostic.
   */
  severity: SeverityModule.Severity,

  /**
   * Human-readable message describing the issue.
   */
  message: S.String,
}).annotations({
  identifier: 'DiagnosticBase',
  description: 'Base diagnostic structure with three-level hierarchy',
})

export type DiagnosticBase = S.Schema.Type<typeof DiagnosticBase>

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a diagnostic schema that extends DiagnosticBase.
 *
 * This helper properly handles field narrowing (like severity)
 * and ensures the diagnostic follows the three-level hierarchy.
 *
 * @example
 * ```typescript
 * const MyDiagnostic = Diagnostic.create({
 *   source: 'my-feature',
 *   name: 'specific-error',
 *   severity: 'error',
 *   context: {
 *     customField: S.String,
 *   }
 * })
 * ```
 */
export const create = <
  Source extends string,
  Name extends string,
  Severity extends 'error' | 'warning' | 'info' | undefined = undefined,
  Context extends S.Struct.Fields = {},
>(
  config: {
    source: Source
    name: Name
    severity?: Severity
    context?: Context
  },
):
  & Omit<
    S.Struct<
      {
        _tag: typeof S.Literal<['Diagnostic']>
        source: typeof S.Literal<[Source]>
        name: typeof S.Literal<[Name]>
        severity: Severity extends string ? typeof S.Literal<[Severity]> : typeof SeverityModule.Severity
        message: typeof S.String
      } & Context
    >,
    'make'
  >
  & {
    make: (
      fields: { message: string } & (Context extends {} ? S.Struct.Type<Context> : {}),
    ) => S.Struct.Type<
      S.Struct<
        {
          _tag: typeof S.Literal<['Diagnostic']>
          source: typeof S.Literal<[Source]>
          name: typeof S.Literal<[Name]>
          severity: Severity extends string ? typeof S.Literal<[Severity]> : typeof SeverityModule.Severity
          message: typeof S.String
        } & Context
      >
    >
  } =>
{
  // Build the complete fields, merging with defaults
  const baseFields = {
    _tag: S.Literal('Diagnostic'),
    source: S.Literal(config.source),
    name: S.Literal(config.name),
    severity: config.severity ? S.Literal(config.severity) : SeverityModule.Severity,
    message: S.String,
  }

  const completeFields = config.context
    ? { ...baseFields, ...config.context }
    : baseFields

  const schema = S.Struct(completeFields)

  // Create custom make function
  const customMake = (fields: any) => {
    const fullFields = {
      _tag: 'Diagnostic' as const,
      source: config.source,
      name: config.name,
      ...(config.severity ? { severity: config.severity } : { severity: fields.severity || 'info' }),
      ...fields,
    }
    return schema.make(fullFields)
  }

  // Return a new object that spreads the schema but replaces make
  const diagnosticSchema = Object.assign(Object.create(Object.getPrototypeOf(schema)), schema, {
    make: customMake,
    // Override annotations to preserve custom make
    annotations: function(annotations: any) {
      const newSchema = schema.annotations(annotations)
      return Object.assign(Object.create(Object.getPrototypeOf(newSchema)), newSchema, {
        make: customMake,
      })
    },
  })

  return diagnosticSchema as any
}

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(DiagnosticBase)
export const decodeSync = S.decodeSync(DiagnosticBase)
export const encode = S.encode(DiagnosticBase)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(DiagnosticBase)

/**
 * Check if a value is any diagnostic (Level 1).
 */
export const isDiagnostic = (value: unknown): value is DiagnosticBase => is(value)

/**
 * Check if a diagnostic is from a specific source (Level 2).
 */
export const isFromSource = (diagnostic: DiagnosticBase, source: string): boolean => diagnostic.source === source

/**
 * Check if a diagnostic has a specific name (Level 3).
 */
export const isNamed = (diagnostic: DiagnosticBase, name: string): boolean => diagnostic.name === name

/**
 * Check if a diagnostic is from a source and has a specific name.
 */
export const isSpecific = (diagnostic: DiagnosticBase, source: string, name: string): boolean =>
  diagnostic.source === source && diagnostic.name === name

export const isError = (diagnostic: DiagnosticBase): boolean =>
  diagnostic.severity === SeverityModule.Severity.enums.error

export const isWarning = (diagnostic: DiagnosticBase): boolean =>
  diagnostic.severity === SeverityModule.Severity.enums.warning

export const isInfo = (diagnostic: DiagnosticBase): boolean =>
  diagnostic.severity === SeverityModule.Severity.enums.info

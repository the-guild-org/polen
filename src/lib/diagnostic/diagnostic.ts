import { EffectKit, S } from 'graphql-kit'
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
export const Diagnostic = S.Struct({
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

export type Diagnostic = typeof Diagnostic.Type

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
  source extends string,
  name extends string,
  severity extends SeverityModule.Severity | undefined = undefined,
  context extends S.Struct.Fields = {},
>(
  params: {
    source: source
    name: name
    severity?: severity
    context?: context
  },
): S.TaggedStruct<
  'Diagnostic',
  & Omit<EffectKit.Schema.Struct.ExtractFields<typeof Diagnostic>, 'name' | 'source' | 'severity' | '_tag'>
  & {
    name: S.Literal<[name]>
    source: S.Literal<[source]>
    severity: severity extends string ? S.Literal<[severity]>
      : EffectKit.Schema.Struct.ExtractFields<typeof Diagnostic>['severity']
  }
  & context
> => {
  // Use TaggedStruct instead of Struct, and omit _tag from fields since TaggedStruct adds it
  const { _tag, ...diagnosticFieldsWithoutTag } = Diagnostic.fields
  return S.TaggedStruct('Diagnostic', {
    ...diagnosticFieldsWithoutTag,
    source: S.Literal(params.source),
    name: S.Literal(params.name),
    ...(params.severity ? { severity: S.Literal(params.severity) } : {}),
    ...params.context,
  }) as any
}

export const createMake = <diagnostic extends S.TaggedStruct<any, any>>(
  diagnostic: diagnostic,
): EffectKit.Schema.ConstructorUsingOmitLiteral1Algo<diagnostic> => {
  return ((fields: object) => {
    return diagnostic.make({
      ...EffectKit.Schema.pickLiteral1FieldsAsLiterals(diagnostic),
      ...fields,
    }) as any
  }) as any
}

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Diagnostic)
export const decodeSync = S.decodeSync(Diagnostic)
export const encode = S.encode(Diagnostic)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Diagnostic)

import { S } from 'graphql-kit'
import { Order } from 'effect'

// ============================================================================
// Schema - Severity
// ============================================================================

export const Severity = S.Enums(
  {
    error: 'error',
    warning: 'warning',
    info: 'info',
  } as const,
).annotations({
  identifier: 'DiagnosticSeverity',
  description: 'The severity level of a diagnostic message',
})

Severity.enums.error

export type Severity = typeof Severity.Type

// ============================================================================
// Severity Literals
// ============================================================================

export const Error = S.Literal(Severity.enums.error)
export const Warning = S.Literal(Severity.enums.warning)
export const Info = S.Literal(Severity.enums.info)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Severity)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Severity)
export const decodeSync = S.decodeSync(Severity)
export const encode = S.encode(Severity)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Severity)

// ============================================================================
// Ordering
// ============================================================================

/**
 * Order for severity levels.
 * error > warning > info
 */
export const order: Order.Order<Severity> = Order.mapInput(
  Order.number,
  (severity: Severity) => {
    switch (severity) {
      case Severity.enums.error:
        return 3
      case Severity.enums.warning:
        return 2
      case Severity.enums.info:
        return 1
    }
  },
)

// ============================================================================
// Utilities
// ============================================================================

/**
 * Returns the highest severity from an array of severities.
 * Returns 'info' if array is empty.
 */
export const highest = (severities: Severity[]): Severity => {
  if (severities.length === 0) return Severity.enums.info
  return severities.reduce(Order.max(order))
}

/**
 * Returns the lowest severity from an array of severities.
 * Returns 'error' if array is empty (most conservative).
 */
export const lowest = (severities: Severity[]): Severity => {
  if (severities.length === 0) return Severity.enums.error
  return severities.reduce(Order.min(order))
}

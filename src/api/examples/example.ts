import { S } from '#lib/kit-temp/effect'
import { Order } from 'effect'

// ============================================================================
// Schema - Example
// ============================================================================

export const Example = S.Struct({
  id: S.String,
  path: S.String,
  versions: S.Array(S.String),
  content: S.Record({ key: S.String, value: S.String }),
}).annotations({
  identifier: 'Example',
  description: 'A GraphQL example with versioned content',
})

export type Example = S.Schema.Type<typeof Example>

// ============================================================================
// Constructors
// ============================================================================

export const make = Example.make

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<Example> = Order.mapInput(
  Order.string,
  (example: Example) => example.id,
)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalent = S.equivalence(Example)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Example)

// ============================================================================
// State Predicates
// ============================================================================

export const hasDefaultOnly = (example: Example): boolean =>
  example.versions.length === 1 && example.versions[0] === 'default'

export const hasVersions = (example: Example): boolean =>
  example.versions.length > 1 || (example.versions.length === 1 && example.versions[0] !== 'default')

export const isUnused = (example: Example, usedVersions: string[]): boolean => {
  const unusedVersions = example.versions.filter(v => !usedVersions.includes(v))
  return unusedVersions.length === example.versions.length
}

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Example)
export const decodeSync = S.decodeSync(Example)
export const encode = S.encode(Example)

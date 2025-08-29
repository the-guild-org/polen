import { Level } from '#lib/change/level'
import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

export const Criticality = S.Struct({
  level: Level,
  reason: S.optional(S.String),
}).annotations({
  identifier: 'Criticality',
  title: 'Change Criticality',
  description: 'The criticality assessment of a GraphQL schema change',
})

export type Level = S.Schema.Type<typeof Level>
export type Criticality = S.Schema.Type<typeof Criticality>

// ============================================================================
// Constructors
// ============================================================================

export const make = Criticality.make

// ============================================================================
// Guards
// ============================================================================

export const is = S.is(Criticality)

// ============================================================================
// State Predicates
// ============================================================================

export const isBreaking = (criticality: Criticality): boolean => criticality.level === 'BREAKING'

export const isDangerous = (criticality: Criticality): boolean => criticality.level === 'DANGEROUS'

export const isSafe = (criticality: Criticality): boolean => criticality.level === 'NON_BREAKING'

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Criticality)
export const encode = S.encode(Criticality)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Criticality)

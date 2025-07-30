// ============================================================================
// Bridge Selection DSL Types
// ============================================================================

/**
 * Bridge Selection DSL as specified in plan.md
 *
 * Examples:
 * - { foo: true } - singleton (no dehydrated keys)
 * - { schema: { versioned: { version: '1.0.0' } } } - ADT with keys
 * - { revision: { initial: { date: '2025-12-14', $schema: { versioned: { version: "123" } } } } } - with context
 *
 * Format:
 * - For non-ADT types without keys: { typeName: true }
 * - For non-ADT types with keys: { typeName: { key: value, ... } }
 * - For ADT unions: { adtName: { memberName: true | { key: value, ... } } }
 * - Context is specified with $-prefixed properties
 */
export type BridgeSelection = {
  [key: string]: true | BridgeSelectionValue | BridgeSelectionADT
}

/**
 * Path disambiguation structure ($$)
 * Used when a hydratable appears in multiple paths or non-singleton paths
 * Contains parent's unique keys and a single $<Tag> pointing to next parent
 */
export type PathDisambiguation = {
  [key: string]: unknown | { [K in `$${string}`]: PathDisambiguation | {} }
}

/**
 * Selection value for types with dehydrated keys
 */
export type BridgeSelectionValue = {
  [key: string]: unknown | BridgeSelectionContext | PathDisambiguation
  $$?: PathDisambiguation
}

/**
 * Selection for ADT unions
 */
export type BridgeSelectionADT = {
  [memberName: string]: true | BridgeSelectionValue
}

/**
 * Context selection (prefixed with $)
 */
export type BridgeSelectionContext = {
  [K in `$${string}`]: BridgeSelection
}

/**
 * Main selection type that users provide
 * Can be a single selection or an array of selections
 */
export type Selection = BridgeSelection | Selection[]

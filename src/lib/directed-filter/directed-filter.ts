import { S } from 'graphql-kit'
import { Match } from 'effect'

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a DirectedFilter schema for a given item schema.
 * Returns an object containing the Union schema and its member schemas.
 *
 * @param itemSchema - The schema for items in the filter
 * @returns Object with Union, Allow, Deny, AllowAll, and DenyAll schemas
 */
export const create = <ItemSchema extends S.Schema.Any>(itemSchema: ItemSchema) => {
  const Allow = S.TaggedStruct('DirectedFilterAllow', {
    items: S.Array(itemSchema),
  }).annotations({
    identifier: 'DirectedFilterAllow',
    description: 'Filter that allows only specified items',
  })

  const Deny = S.TaggedStruct('DirectedFilterDeny', {
    items: S.Array(itemSchema),
  }).annotations({
    identifier: 'DirectedFilterDeny',
    description: 'Filter that denies specified items',
  })

  const AllowAll = S.TaggedStruct('DirectedFilterAllowAll', {}).annotations({
    identifier: 'DirectedFilterAllowAll',
    description: 'Filter that allows all items (no-op)',
  })

  const DenyAll = S.TaggedStruct('DirectedFilterDenyAll', {}).annotations({
    identifier: 'DirectedFilterDenyAll',
    description: 'Filter that denies all items',
  })

  const Union = S.Union(Allow, Deny, AllowAll, DenyAll).annotations({
    identifier: 'DirectedFilter',
    description: 'A filter that controls item inclusion/exclusion',
  })

  return {
    Union,
    Allow,
    Deny,
    AllowAll,
    DenyAll,
  } as const
}

// ============================================================================
// Types
// ============================================================================

export type DirectedFilterAllow<T> = {
  readonly _tag: 'DirectedFilterAllow'
  readonly items: readonly T[]
}

export type DirectedFilterDeny<T> = {
  readonly _tag: 'DirectedFilterDeny'
  readonly items: readonly T[]
}

export type DirectedFilterAllowAll = {
  readonly _tag: 'DirectedFilterAllowAll'
}

export type DirectedFilterDenyAll = {
  readonly _tag: 'DirectedFilterDenyAll'
}

export type DirectedFilter<T> =
  | DirectedFilterAllow<T>
  | DirectedFilterDeny<T>
  | DirectedFilterAllowAll
  | DirectedFilterDenyAll

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Filters a collection based on a DirectedFilter using a custom value getter.
 * Returns a curried function for partial application.
 * Short-circuits for AllowAll/DenyAll for performance.
 *
 * TODO: Use equivalence trait from schema if available instead of === for comparison
 *
 * @param filter - The DirectedFilter to apply
 * @returns Curried function that takes a value getter and then a collection
 */
export const filterBy = <FilterItem>(
  filter: DirectedFilter<FilterItem>,
) =>
<Item>(
  getValue: (item: Item) => FilterItem,
) =>
(
  collection: readonly Item[],
): Item[] => {
  return Match.value(filter).pipe(
    Match.tagsExhaustive({
      DirectedFilterAllowAll: () => [...collection], // Return copy for immutability
      DirectedFilterDenyAll: () => [],
      DirectedFilterAllow: (f) => {
        const allowSet = new Set(f.items)
        return collection.filter(item => allowSet.has(getValue(item)))
      },
      DirectedFilterDeny: (f) => {
        const denySet = new Set(f.items)
        return collection.filter(item => !denySet.has(getValue(item)))
      },
    }),
  )
}

/**
 * Filters a collection based on a DirectedFilter using a property name.
 * Convenience function that extracts values by property key.
 *
 * @param filter - The DirectedFilter to apply
 * @returns Curried function that takes a property name and then a collection
 */
export function filterByProperty<FilterItem>(
  filter: DirectedFilter<FilterItem>,
): <K extends PropertyKey>(
  propertyName: K,
) => <Item extends Record<K, any>>(
  collection: readonly Item[],
) => Item[]
export function filterByProperty<FilterItem>(
  filter: DirectedFilter<FilterItem>,
) {
  return <K extends PropertyKey>(propertyName: K) =>
  <Item extends Record<K, any>>(collection: readonly Item[]): Item[] => {
    return filterBy(filter)((item: Item) => item[propertyName] as FilterItem)(collection)
  }
}

/**
 * Filters a collection based on a DirectedFilter using identity.
 * Used when the items themselves are the filter values.
 *
 * @param filter - The DirectedFilter to apply
 * @returns Function that filters a collection
 */
export const filter = <Item>(
  filter: DirectedFilter<Item>,
) =>
(
  collection: readonly Item[],
): Item[] => {
  return filterBy(filter)((item: Item) => item)(collection)
}

// ============================================================================
// Constructors
// ============================================================================

/**
 * Const instance for allowing all items.
 */
export const AllowAll: DirectedFilterAllowAll = { _tag: 'DirectedFilterAllowAll' }

/**
 * Const instance for denying all items.
 */
export const DenyAll: DirectedFilterDenyAll = { _tag: 'DirectedFilterDenyAll' }

/**
 * Creates an Allow filter with the specified items.
 */
export const allow = <T>(items: readonly T[]): DirectedFilterAllow<T> => ({
  _tag: 'DirectedFilterAllow',
  items,
})

/**
 * Creates a Deny filter with the specified items.
 */
export const deny = <T>(items: readonly T[]): DirectedFilterDeny<T> => ({
  _tag: 'DirectedFilterDeny',
  items,
})

/**
 * Creates a DirectedFilter from only/exclude pattern commonly used in configuration.
 * Returns AllowAll if neither only nor exclude has items.
 *
 * @param only - Items to allow (takes precedence over exclude)
 * @param exclude - Items to deny
 * @returns DirectedFilter (never null)
 */
export const fromOnlyExclude = <T>(
  only: readonly T[] | undefined,
  exclude: readonly T[] | undefined,
  /**
   * @default allowAll
   */
  fallback?: DirectedFilterDenyAll | DirectedFilterAllowAll,
): DirectedFilter<T> => {
  if (only && only.length > 0) {
    return allow(only)
  }
  if (exclude && exclude.length > 0) {
    return deny(exclude)
  }
  return fallback ?? AllowAll
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for DirectedFilterAllow
 */
export const isAllow = <T>(filter: DirectedFilter<T>): filter is DirectedFilterAllow<T> =>
  filter._tag === 'DirectedFilterAllow'

/**
 * Type guard for DirectedFilterDeny
 */
export const isDeny = <T>(filter: DirectedFilter<T>): filter is DirectedFilterDeny<T> =>
  filter._tag === 'DirectedFilterDeny'

/**
 * Type guard for DirectedFilterAllowAll
 */
export const isAllowAll = <T>(filter: DirectedFilter<T>): filter is DirectedFilterAllowAll =>
  filter._tag === 'DirectedFilterAllowAll'

/**
 * Type guard for DirectedFilterDenyAll
 */
export const isDenyAll = <T>(filter: DirectedFilter<T>): filter is DirectedFilterDenyAll =>
  filter._tag === 'DirectedFilterDenyAll'

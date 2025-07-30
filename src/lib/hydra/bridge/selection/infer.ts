/**
 * Type-level utilities for inferring Bridge selection types from schemas
 *
 * This module provides type inference for the Bridge selection DSL,
 * enabling type-safe queries based on Effect schemas.
 */

import type { S } from '#lib/kit-temp/effect'
import type { Hydratable } from '../../hydratable.js'
import type { Value } from '../../value/$.js'

// ============================================================================
// Main Types
// ============================================================================

/**
 * Main selection type that matches the DSL from plan.md
 */
export type BridgeSelection = {
  [key: string]: true | Record<string, any>
}

/**
 * Extract the tag from a tagged struct type
 */
type ExtractTag<$T> = $T extends { _tag: infer Tag extends string } ? Tag : never

/**
 * Transform tag to lowercase for selection key
 */
type TagToSelectionKey<$Tag extends string> = Lowercase<$Tag>

/**
 * Check if a type is a union that includes a dehydrated variant
 */
type IsHydratableUnion<$T> = Exclude<$T, { _dehydrated: true }> extends never ? false
  : Extract<$T, { _dehydrated: true }> extends never ? false
  : true

/**
 * Extract hydrated member from a hydratable union
 */
type ExtractHydrated<$T> = Exclude<$T, { _dehydrated: true }>

/**
 * Get hydration keys from annotations for a specific tag
 */
type GetHydrationKeysForTag<$S extends S.Schema.Any, $Tag extends string> = $S extends Hydratable<$S, infer Keys>
  ? Keys extends readonly string[] ? Keys
  : Keys extends Record<string, readonly string[]> ? $Tag extends keyof Keys ? Keys[$Tag]
    : never
  : never
  : never

/**
 * Extract unique keys for a specific hydratable tag
 */
type GetUniqueKeysForHydratable<$S extends S.Schema.Any, $T> = $T extends { _tag: infer Tag extends string }
  ? GetHydrationKeysForTag<$S, Tag>
  : never

/**
 * Infer selection value for a hydratable based on its unique keys
 */
type InferSelectionValue<$UniqueKeys> = $UniqueKeys extends readonly [] ? true // Singleton (no unique keys)
  : $UniqueKeys extends readonly [infer K extends string] ? { [P in K]: any } | any // Single key - allow shorthand
  : $UniqueKeys extends readonly string[] ? { [P in $UniqueKeys[number]]: any } // Multiple keys - object only
  : true // Default to singleton

/**
 * Extract all hydratable tags from a schema type
 */
type ExtractHydratableTags<$S extends S.Schema.Any> = $S extends S.Schema<infer T>
  ? IsHydratableUnion<T> extends true ? ExtractTag<ExtractHydrated<T>>
  : never
  : never

/**
 * Build selection type for a single hydratable tag
 */
type BuildSelectionForTag<$S extends S.Schema.Any, $Tag extends string> = $S extends S.Schema<infer __t__>
  ? IsHydratableUnion<__t__> extends true
    ? ExtractHydrated<__t__> extends { _tag: $Tag }
      ? InferSelectionValue<GetUniqueKeysForHydratable<$S, ExtractHydrated<__t__>>>
    : never
  : never
  : never

/**
 * Main type utility to infer Bridge selection type from a schema
 *
 * @example
 * ```typescript
 * type CatalogSchema = typeof Catalog.CatalogHydratable
 * type CatalogSelection = InferBridgeSelectionFromSchema<CatalogSchema>
 * // Result: { CatalogVersioned: true | { version: "1.0.0" }, CatalogUnversioned: true | {} }
 * ```
 */
export type InferBridgeSelectionFromSchema<$S extends S.Schema.Any> = ExtractHydratableTags<$S> extends never
  ? Record<string, never> // No hydratables found
  : {
    [K in ExtractHydratableTags<$S> as TagToSelectionKey<K>]?: BuildSelectionForTag<$S, K>
  }

/**
 * Extract hydrated types matching selected tags
 */
type ExtractSelectedHydrated<$T, $SelectedTags extends string> = $T extends { _tag: $SelectedTags }
  ? Exclude<$T, Value.Dehydrated>
  : never

/**
 * Infers the fully hydrated data type from a schema and selection.
 *
 * This type utility ensures that the view function returns the exact
 * hydrated type based on the provided selection, with no optionality
 * since view guarantees full hydration.
 *
 * When selection is not provided (undefined), returns the root data type.
 *
 * @example
 * ```typescript
 * type Result = InferHydratedDataFromSelection<CatalogSchema, { CatalogVersioned: true }>
 * // Result: CatalogVersioned (fully hydrated, non-optional)
 *
 * type RootResult = InferHydratedDataFromSelection<CatalogSchema, undefined>
 * // Result: Catalog (the root type, fully hydrated)
 * ```
 */
export type InferHydratedDataFromSelection<
  $S extends S.Schema.Any,
  $Selection extends InferBridgeSelectionFromSchema<$S> | undefined,
> = $Selection extends undefined ? S.Schema.Type<$S> // No selection = return root data type
  : $Selection extends BridgeSelection
    ? $S extends S.Schema<infer T> ? ExtractSelectedHydrated<T, Extract<keyof $Selection, string>>
    : never
  : never

/**
 * Extract types (hydrated or dehydrated) matching selected tags
 */
type ExtractSelectedTypes<$T, $SelectedTags extends string> = $T extends { _tag: $SelectedTags } ? $T // Can be either hydrated or dehydrated
  : never

/**
 * Infers the possibly dehydrated data type from a schema and selection.
 *
 * This type utility is used by the peek function which returns data
 * that may contain dehydrated references.
 *
 * When selection is not provided (undefined), returns the root data type.
 *
 * @example
 * ```typescript
 * type Result = InferDehydratedDataFromSelection<CatalogSchema, { CatalogVersioned: true }>
 * // Result: CatalogVersioned | CatalogVersionedDehydrated (possibly dehydrated)
 * ```
 */
export type InferDehydratedDataFromSelection<
  $S extends S.Schema.Any,
  $Selection extends InferBridgeSelectionFromSchema<$S> | undefined,
> = $Selection extends undefined ? S.Schema.Type<$S> // No selection = return root data type
  : $Selection extends BridgeSelection
    ? $S extends S.Schema<infer T> ? ExtractSelectedTypes<T, Extract<keyof $Selection, string>>
    : never
  : never

import { EffectKit } from '#lib/kit-temp/effect'
import { Uhl } from '../uhl/$.js'
import { Value } from '../value/$.js'

/**
 * Map type for the bridge index - UHL string to hydratable value
 */
export type Data = Map<string, Value.Hydratable>

/**
 * Bridge index for O(1) asset lookups
 * Maps UHL string representations to hydratable values
 */
export interface Index {
  readonly fragments: Data
  root: Value.Hydratable | null
}

export const create = (): Index => ({
  root: null,
  fragments: new Map(),
})

/**
 * Adds located hydratables to the index using their UHL as the key
 * Hydrated values take precedence over dehydrated ones when they share the same UHL.
 * When a hydrated value replaces a dehydrated one, all references to the dehydrated
 * value are mutated to point to the hydrated value.
 *
 * @param locatedHydratables - Array of hydratables with their UHL locations
 * @param index - The Bridge index to add entries to
 */
export const addHydratablesToIndex = (
  locatedHydratables: Value.Located[],
  index: Index,
): void => {
  for (const located of locatedHydratables) {
    const key = Uhl.toString(located.uhl)
    const existingValue = index.fragments.get(key)

    if (!existingValue) {
      // No existing value, just add it
      index.fragments.set(key, located.value)
    } else if (Value.isHydrated(located.value) && Value.isDehydrated(existingValue)) {
      // Hydrated value replaces dehydrated - mutate the dehydrated value
      // We know existingValue is tagged because dehydrated values are tagged structs
      EffectKit.Struct.clearExceptTag(existingValue as unknown as EffectKit.Struct.TaggedStruct)
      // Copy all properties from hydrated value
      Object.assign(existingValue, located.value)
      // The index already has the reference, no need to set again
    }
    // Otherwise keep existing (hydrated beats everything)
  }
}

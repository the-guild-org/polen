/**
 * Function to add located hydratables to the Bridge index
 *
 * This module provides the functionality to convert located hydratables
 * into index entries using their UHL (UniversalHydratableLocator) as keys.
 *
 * @module
 */

import { EffectKit } from '#lib/kit-temp/effect'
import { UHL } from '../../uhl/$.js'
import { Value } from '../../value/$.js'
import * as Index from '../index.js'

/**
 * Adds located hydratables to the index using their UHL as the key
 * Hydrated values take precedence over dehydrated ones when they share the same UHL.
 *
 * @param locatedHydratables - Array of hydratables with their UHL locations
 * @param index - The Bridge index to add entries to
 */
export const addHydratablesToIndex = (
  locatedHydratables: Value.Located[],
  index: Index.Index,
): void => {
  for (const located of locatedHydratables) {
    // Convert UHL to string format for use as index key
    const key = UHL.toString(located.uhl)

    // Check if we already have a value for this key
    const existingValue = index.data.get(key)

    // If no existing value, or if the new value is hydrated (takes precedence), add it
    const isNewValueHydrated = EffectKit.Struct.isTagged(located.value) && !(located.value as any)._dehydrated

    if (!existingValue || isNewValueHydrated) {
      index.data.set(key, located.value)
    } else if (existingValue && EffectKit.Struct.isTagged(existingValue) && EffectKit.Struct.isTagged(located.value)) {
      // If existing value is dehydrated and new value is hydrated, replace
      const isExistingDehydrated = (existingValue as any)._dehydrated
      if (isExistingDehydrated && isNewValueHydrated) {
        index.data.set(key, located.value)
      }
      // Otherwise keep existing (hydrated beats dehydrated)
    }
  }
}

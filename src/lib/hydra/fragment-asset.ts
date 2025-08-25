import { type Fragment, fragmentsFromRootValue } from '#lib/hydra/fragment'
import { EffectKit, S } from '#lib/kit-temp/effect'
import type { Writable } from 'type-fest'
import { mapContainerHydratables } from './container.js'
import { Hydratable } from './hydratable/$.js'
import { Uhl } from './uhl/$.js'
import { Value } from './value/$.js'

export type FragmentAsset = {
  filename: string
  content: string
}

export const fragmentAssetsFromRootValue = <schema extends S.Schema.Any>(
  rootValue: S.Schema.Type<schema>,
  schema: schema,
): FragmentAsset[] => {
  const hydrationContext = Hydratable.createContext(schema)
  const fragments = fragmentsFromRootValue(rootValue, hydrationContext)
  const fragmentAssets = fragments.map(fragment => fragmentAssetFromFragment(fragment, hydrationContext))
  return fragmentAssets
}

export const fragmentAssetFromFragment = (
  fragment: Fragment,
  hydrationContext: Hydratable.Context,
): FragmentAsset => {
  const encodedValue = valueToFragmentAssetContent(fragment.value, hydrationContext)
  const filename = Uhl.toFileName(fragment.uhl)
  const fragmentAsset: FragmentAsset = {
    filename,
    content: JSON.stringify(encodedValue, null, 2),
  }
  return fragmentAsset
}

/**
 * Encode a value for export. This encodes the value (handling transformations) and
 * dehydrates any nested hydratables to ensure fragments only contain references to other fragments.
 * The fragment itself remains hydrated.
 */
export const valueToFragmentAssetContent = <container extends object>(
  container: container,
  context: Hydratable.Context,
): unknown => {
  if (Value.isDehydrated(container)) {
    throw new Error('Cannot create fragment asset from a dehydrated value')
  }

  // Step 1: Dehydrate nested hydratables while keeping root fragment hydrated
  const valueWithDehydratedChildHydratables = mapContainerHydratables(container, context, (hydratable) => {
    return Value.dehydrateFromContext(hydratable, context)
  })

  // Step 2: Encode it if applicable
  // todo: support root-level decoders
  // Find the fragment schema for this value, either by tag or assume root
  // const schema = undefined as any // context.encodersIndex // todo
  if (!EffectKit.Struct.isTagged(valueWithDehydratedChildHydratables)) {
    throw new Error('Root fragment value must be a tagged struct')
  }

  // If schema has decoder, run it
  // TODO: do a schema lookup instead, finding encoder on that.
  const encoder = context.encodersIndex.get((valueWithDehydratedChildHydratables as any)._tag)
  if (encoder) {
    return encoder(valueWithDehydratedChildHydratables)
  }

  // If shcema has no decoder, return value as-is
  return valueWithDehydratedChildHydratables
}

/**
 * - Derive UHL from filename
 * - Parse JSON content
 * - Decode (if schema has decoder)
 */
export const fragmentAssetToFragment = (
  fragmentAsset: FragmentAsset,
  hydrationContext: Hydratable.Context,
): Fragment => {
  const uhl = Uhl.fromFileName(fragmentAsset.filename)
  const fragment: Writable<Fragment> = {
    uhl,
    value: JSON.parse(fragmentAsset.content),
  }

  if (!EffectKit.Struct.isTagged(fragment.value)) {
    throw new Error(`Fragment ${fragmentAsset.filename} is not a tagged struct`)
  }

  // Use transformed schema if available, fall back to original AST
  const transformedSchema = hydrationContext.transformedAstIndex?.get(fragment.value._tag)
  const ast = hydrationContext.astIndex.get(fragment.value._tag)

  if (transformedSchema || ast) {
    try {
      // Check if fragment contains dehydrated references anywhere
      const hasDehydratedReferences = (val: unknown): boolean => {
        if (val == null || typeof val !== 'object') return false
        if (typeof val === 'object' && '_dehydrated' in val && val._dehydrated === true) return true
        if (Array.isArray(val)) return val.some(hasDehydratedReferences)
        return Object.values(val as any).some(hasDehydratedReferences)
      }

      // Use transformed schema if available, otherwise create from AST
      const schema = transformedSchema || S.make(ast! as any)

      // Try to decode normally first
      try {
        fragment.value = S.decodeSync(schema as any)(fragment.value) as any
      } catch (error) {
        // If decoding fails and the fragment contains dehydrated references,
        // this might be the complex circular reference case - keep raw JSON
        if (hasDehydratedReferences(fragment.value)) {
          console.warn(
            `Decoding failed for fragment ${fragmentAsset.filename} with dehydrated references - keeping raw JSON`,
          )
          // Keep the raw parsed JSON to handle complex circular references
          // This is a fallback for the suspended schema validation issue
        } else {
          // Re-throw error if it's not related to dehydrated references
          throw error
        }
      }
    } catch (error) {
      // If decoding fails, keep the raw value and log a warning
      // This maintains backward compatibility
      console.warn(`Failed to decode fragment ${fragmentAsset.filename}:`, error)
    }
  }

  return fragment
}

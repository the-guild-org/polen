import { type FragmentAsset, fragmentAssetFromFragment } from '../fragment-asset.js'
import type { Fragment } from '../fragment.js'
import { Hydratable } from '../hydratable/$.js'
import { Uhl } from '../uhl/$.js'
import type { Index } from './index.js'

export const toFragments = (index: Index): Fragment[] => {
  const fragments = [...index.fragments.entries()]
    .map(([uhlString, value]) => {
      const fragment = {
        uhl: Uhl.fromString(uhlString),
        value,
      }
      return fragment
    })
  return fragments
}

export const toFragmentAssets = (index: Index, hydrationContext: Hydratable.Context): FragmentAsset[] => {
  const fragmentAssets = toFragments(index)
    .map((fragment) => {
      return fragmentAssetFromFragment(fragment, hydrationContext)
    })
  return fragmentAssets
}

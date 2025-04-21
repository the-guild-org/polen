import type { Vite } from '../vite/_namespace.js'
import type { VirtualIdentifierAndLoader } from './virtual-identifier.js'
import { toHooks$FromEntries } from './virtual-identifier.js'

export const Plugin = (...entries: VirtualIdentifierAndLoader[]): Vite.Plugin => {
  return {
    name: `vite-virtual`,
    // enforce: `post`,
    ...toHooks$FromEntries(...entries),
  }
}

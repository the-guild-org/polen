import type { Vite } from '../../lib-dependencies/vite/index.js'

export type HookLoad = Vite.HookLoadFnPure

export type HookResolveId = Vite.HookResolveIdFnPure

export type Hooks = Pick<Vite.Plugin, `resolveId` | `load`>

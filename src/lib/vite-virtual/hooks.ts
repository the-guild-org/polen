import type { Vite } from '../vite/_namespace.js'

export type HookLoad = Vite.HookLoadFnPure

export type HookResolveId = Vite.HookResolveIdFnPure

export type Hooks = Pick<Vite.Plugin, `resolveId` | `load`>

import type { Vite } from '#dep/vite/index.ts'

export type HookLoad = Vite.HookLoadFnPure

export type HookResolveId = Vite.HookResolveIdFnPure

export type Hooks = Pick<Vite.Plugin, `resolveId` | `load`>

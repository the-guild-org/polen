import type { Vite } from '#dep/vite/index.ts'
import { StackProcessor } from '../stack-processor/index.ts'
import { debug } from './debug.ts'
import type { HookLoad, HookResolveId } from './hooks.ts'
import type { Identifier } from './identifier.ts'

export interface IdentifiedLoader {
  identifier: Identifier
  loader: Vite.HookLoadFnPure
}

export const toHookLoad = (
  identifiedLoader: IdentifiedLoader,
): HookLoad => {
  return async (...args) => {
    // debug(`load candidate`, { virtualIdentifier, args })
    if (args[0] === identifiedLoader.identifier.resolved) {
      debug(`will load`, { identifier: identifiedLoader.identifier })
      const result = await identifiedLoader.loader(...args)
      debug(`did load`, { identifier: identifiedLoader.identifier, result })
      // Add moduleType for Rolldown compatibility
      if (result && typeof result === `string`) {
        return { code: result, moduleType: `js` }
      }
      return result
    }
    return undefined
  }
}

export const toHookResolveId = (identifiedLoader: IdentifiedLoader): HookResolveId => {
  return id => {
    if (id === identifiedLoader.identifier.id) {
      return identifiedLoader.identifier.resolved
    }
    return undefined
  }
}

export const toHooks = (
  ...identifiedloaders: IdentifiedLoader[]
): {
  resolveId: Vite.HookResolveIdFnPure
  load: Vite.HookLoadFnPure
} => {
  const resolveId = StackProcessor.untilDefined<HookResolveId>(
    identifiedloaders.map(toHookResolveId),
  )

  const load = StackProcessor.untilDefined(
    identifiedloaders.map(toHookLoad),
  )

  return {
    resolveId,
    load,
  }
}

export const toPlugin = (...identifiedLoaders: IdentifiedLoader[]): Vite.Plugin => {
  return {
    name: `vite-virtual`,
    ...toHooks(...identifiedLoaders),
  }
}

import { O } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import { StackProcessor } from '#lib/stack-processor'
import { Effect } from 'effect'
import { debug } from './debug.js'
import type { Identifier } from './identifier.js'

export interface IdentifiedLoader {
  identifier: Identifier
  loader: Vite.HookLoadFnPure
}

export const toHookLoad = (
  identifiedLoader: IdentifiedLoader,
): (
  ...args: Parameters<Vite.HookLoadFnPure>
) => Effect.Effect<O.Option<Awaited<ReturnType<Vite.HookLoadFnPure>>>, Error, never> => {
  return (...args) =>
    Effect.gen(function*() {
      // debug(`load candidate`, { virtualIdentifier, args })
      if (args[0] === identifiedLoader.identifier.resolved) {
        debug(`will load`, { identifier: identifiedLoader.identifier })
        const result = yield* Effect.tryPromise({
          try: () => Promise.resolve(identifiedLoader.loader(...args)),
          catch: (error) => new Error(`Loader failed: ${String(error)}`),
        })
        debug(`did load`, { identifier: identifiedLoader.identifier, result })
        // Add moduleType for Rolldown compatibility
        if (result && typeof result === `string`) {
          return O.some({ code: result, moduleType: `js` })
        }
        return O.some(result)
      }
      return O.none()
    })
}

export const toHookResolveId = (
  identifiedLoader: IdentifiedLoader,
): (
  ...args: Parameters<Vite.HookResolveIdFnPure>
) => Effect.Effect<O.Option<ReturnType<Vite.HookResolveIdFnPure>>, never, never> => {
  return (id) =>
    Effect.succeed(
      id === identifiedLoader.identifier.id
        ? O.some(identifiedLoader.identifier.resolved)
        : O.none(),
    )
}

export const toHooks = (
  ...identifiedloaders: IdentifiedLoader[]
): {
  resolveId: Vite.HookResolveIdFnPure
  load: Vite.HookLoadFnPure
} => {
  const resolveIdEffect = StackProcessor.untilSome(
    identifiedloaders.map(toHookResolveId),
  )

  const loadEffect = StackProcessor.untilSome(
    identifiedloaders.map(toHookLoad),
  )

  return {
    resolveId: async (...args) => {
      const result = await Effect.runPromise(resolveIdEffect(...args))
      return O.getOrUndefined(result)
    },
    load: async (...args) => {
      const result = await Effect.runPromise(loadEffect(...args))
      return O.getOrUndefined(result)
    },
  }
}

export const toPlugin = (...identifiedLoaders: IdentifiedLoader[]): Vite.Plugin => {
  return {
    name: `vite-virtual`,
    ...toHooks(...identifiedLoaders),
  }
}

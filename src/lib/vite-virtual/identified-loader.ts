import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import { StackProcessor } from '#lib/stack-processor'
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
) => Ef.Effect<Op.Option<Awaited<ReturnType<Vite.HookLoadFnPure>>>, Error, never> => {
  return (...args) =>
    Ef.gen(function*() {
      // debug(`load candidate`, { virtualIdentifier, args })
      if (args[0] === identifiedLoader.identifier.resolved) {
        debug(`will load`, { identifier: identifiedLoader.identifier })
        const result = yield* Ef.tryPromise({
          try: () => {
            return Promise.resolve(identifiedLoader.loader(...args))
          },
          catch: (error) => {
            return new Error(`Loader failed: ${String(error)}`)
          },
        })
        debug(`did load`, { identifier: identifiedLoader.identifier, result })
        // Add moduleType for Rolldown compatibility
        if (result && typeof result === `string`) {
          return Op.some({ code: result, moduleType: `js` })
        }
        return Op.some(result)
      }
      return Op.none()
    })
}

export const toHookResolveId = (
  identifiedLoader: IdentifiedLoader,
): (
  ...args: Parameters<Vite.HookResolveIdFnPure>
) => Ef.Effect<Op.Option<ReturnType<Vite.HookResolveIdFnPure>>, never, never> => {
  return (id) =>
    Ef.succeed(
      id === identifiedLoader.identifier.id
        ? Op.some(identifiedLoader.identifier.resolved)
        : Op.none(),
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
    // Framework boundary: Vite plugin resolveId hook expects Promise return type
    resolveId: async (...args) => {
      const result = await Ef.runPromise(resolveIdEffect(...args))
      return Op.getOrUndefined(result)
    },
    // Framework boundary: Vite plugin load hook expects Promise return type
    load: async (...args) => {
      const result = await Ef.runPromise(loadEffect(...args))
      return Op.getOrUndefined(result)
    },
  }
}

export const toPlugin = (...identifiedLoaders: IdentifiedLoader[]): Vite.Plugin => {
  return {
    name: `vite-virtual`,
    ...toHooks(...identifiedLoaders),
  }
}

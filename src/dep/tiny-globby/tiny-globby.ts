import { Effect } from 'effect'
import * as TinyGlobbyLib from 'tinyglobby'

// Re-export original API for backwards compatibility
export * from 'tinyglobby'

// Effect-based wrappers
export namespace EffectGlobby {
  /**
   * Effect-based wrapper for TinyGlobby.glob
   */
  export const glob = (
    pattern: string | string[],
    options?: Omit<TinyGlobbyLib.GlobOptions, 'patterns'>,
  ): Effect.Effect<string[], Error> => Effect.promise(() => TinyGlobbyLib.glob(pattern, options))

  /**
   * Effect-based wrapper for TinyGlobby.globSync (wrapped as Effect for consistency)
   */
  export const globSync = (
    pattern: string | string[],
    options?: Omit<TinyGlobbyLib.GlobOptions, 'patterns'>,
  ): Effect.Effect<string[], Error> =>
    Effect.try({
      try: () => TinyGlobbyLib.globSync(pattern, options),
      catch: (error) => error instanceof Error ? error : new Error(String(error)),
    })
}

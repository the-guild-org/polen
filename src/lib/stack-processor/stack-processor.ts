import { O } from '#dep/effect'
import { Effect } from 'effect'

/**
 * Processes functions sequentially until Some is found.
 * Returns the first Some result, or None if all functions return None.
 */
export const untilSome = <A extends readonly unknown[], R, E, Context>(
  fns: readonly ((..._: A) => Effect.Effect<O.Option<R>, E, Context>)[],
) =>
(...args: A): Effect.Effect<O.Option<R>, E, Context> =>
  Effect.gen(function*() {
    for (const fn of fns) {
      const result = yield* fn(...args)
      if (O.isSome(result)) return result
    }
    return O.none()
  })

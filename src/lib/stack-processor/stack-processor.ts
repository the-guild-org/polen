import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'

/**
 * Processes functions sequentially until Some is found.
 * Returns the first Some result, or None if all functions return None.
 */
export const untilSome = <A extends readonly unknown[], R, E, Context>(
  fns: readonly ((..._: A) => Ef.Effect<Op.Option<R>, E, Context>)[],
) =>
(...args: A): Ef.Effect<Op.Option<R>, E, Context> =>
  Ef.gen(function*() {
    for (const fn of fns) {
      const result = yield* fn(...args)
      if (Op.isSome(result)) return result
    }
    return Op.none()
  })

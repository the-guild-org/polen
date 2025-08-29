import type { Bool, Fn, Prom } from '@wollybeard/kit'
import { Undefined } from '@wollybeard/kit'
import { Effect } from 'effect'

/**
 * Effect-based version that processes functions sequentially until predicate is met
 */
export const untilEffect = <A extends readonly unknown[], R, E, Context>(
  predicate: (value: R) => boolean,
) =>
<fns extends readonly ((..._: A) => Effect.Effect<R, E, Context>)[]>(
  fns: fns,
) =>
(...args: A): Effect.Effect<R | undefined, E, Context> =>
  Effect.gen(function*() {
    for (const fn of fns) {
      const result = yield* fn(...args)
      if (predicate(result)) return result
    }
    return undefined
  })

/**
 * Legacy Promise-based version for backward compatibility
 * @deprecated Use untilEffect for better error handling and composition
 */
export const until = (
  predicate: Bool.Predicate,
) =>
<fn extends Fn.AnyAny>(fns: fn[]): Fn.ReturnExtract<Prom.AnyAny, fn> => {
  // @ts-expect-error
  return async (...args) => {
    for (const fn of fns) {
      const result: any = await fn(...args)
      if (predicate(result)) return result
    }
    return undefined
  }
}

/**
 * Effect-based version that processes functions until a defined result is found
 */
export const untilDefinedEffect = untilEffect(Undefined.isnt)

/**
 * Legacy Promise-based version for backward compatibility
 * @deprecated Use untilDefinedEffect
 */
export const untilDefined = until(Undefined.isnt)

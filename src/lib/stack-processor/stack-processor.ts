import type { Bool, Fn, Prom } from '@wollybeard/kit'
import { Undefined } from '@wollybeard/kit'

export const until = (
  predicate: Bool.Predicate,
) =>
<fn extends Fn.AnyAny>(fns: fn[]): Fn.ReturnExtract<Prom.AnyAny, fn> => {
  // @ts-expect-error
  return async (...args) => {
    for (const fn of fns) {
      // eslint-disable-next-line
      const result: any = await fn(...args)
      if (predicate(result)) return result
    }
    return undefined
  }
}

export const untilDefined = until(Undefined.isnt)

import type { Fn } from '@wollybeard/kit'
import { Eq } from '@wollybeard/kit'

export const until = (
  checkMatch: (value: unknown) => boolean,
) =>
<fn extends Fn.Any>(fns: fn[]): Fn.ExtractAsync<fn> => {
  // @ts-expect-error
  return async (...args) => {
    for (const fn of fns) {
      // eslint-disable-next-line
      const result: any = await fn(...args)
      if (checkMatch(result)) return result
    }
    return undefined
  }
}

export const untilDefined = until(Eq.isNot(undefined))

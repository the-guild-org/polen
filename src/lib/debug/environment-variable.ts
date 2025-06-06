import { Arr, Language } from '@wollybeard/kit'

export const enVarName = `DEBUG`

export const wildcard = `*`
export const enVarEnabledValuesStatic = [`true`, wildcard, `1`]

export const calcIsEnabledFromEnv = (
  enVars: Record<string, unknown>,
  namespace?: string[],
): boolean => {
  const namespace_ = namespace?.map(_ => _.toLowerCase())
  const pattern = typeof enVars[enVarName] === `string`
    ? enVars[enVarName]
      .trim()
      .toLowerCase()
      .split(`:`)
      .map(_ => _.trim())
    : undefined

  if (!pattern) return false

  if (pattern.length === 1 && enVarEnabledValuesStatic.includes(pattern[0]!)) return true

  if (!namespace_) return false

  if (Arr.getLast(pattern) !== wildcard) {
    return pattern.join() === namespace_.join()
  }

  let i = 0
  for (const segment of pattern) {
    if (segment === wildcard) return true
    if (segment !== namespace_[i]) return false
    i++
  }

  Language.never()
}

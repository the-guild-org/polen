export const enVarName = `DEBUG`

export const enVarEnabledValuesStatic = [`true`, `*`, `1`]

export const calcIsEnabledFromEnv = (
  enVars: Record<string, unknown>,
  namespace?: string,
): boolean => {
  const enVar = typeof enVars[enVarName] === `string` ? enVars[enVarName].trim() : undefined

  if (!enVar) return false

  if (enVarEnabledValuesStatic.includes(enVar)) return true

  if (namespace) return enVar.startsWith(namespace)

  return false
}

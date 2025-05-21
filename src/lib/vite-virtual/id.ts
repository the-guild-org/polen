export const idPrefix = `virtual:`

export const resolvedPrefix = `\0`

export const createResolved = (id: string) => `${resolvedPrefix}${id}`

export const createId = (id: string) => `${idPrefix}${id}`

export const normalizeId = (parameters: { id: string; separator?: string }) => {
  if (!parameters.separator) return parameters.id
  return parameters.id.replace(new RegExp(`^${parameters.separator}`), ``)
}

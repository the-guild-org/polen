export const idPrefix = `virtual:`

export const noPluginsMark = `\0`

export const markNoPlugins = (id: string) => `${noPluginsMark}${id}`

export const createId = (id: string) => `${idPrefix}${id}`

export const normalizeId = (parameters: { id: string; separator?: string }) => {
  if (!parameters.separator) return parameters.id
  return parameters.id.replace(new RegExp(`^${parameters.separator}`), ``)
}

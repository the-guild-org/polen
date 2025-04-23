import { createId, createResolved, normalizeId } from './id.js'

export interface Identifier {
  id: string
  resolved: string
  namespace: string | null
  separator: string
}

export const defaults = {
  seperator: `/`,
} as const

export const create = (parameters: {
  id: string,
  namespace?: string,
  separator?: string,
}): Identifier => {
  const separator = parameters.separator ?? defaults.seperator
  const idNormalized = normalizeId({ id: parameters.id, separator })
  const idNamespaced = parameters.namespace
    ? `${parameters.namespace}${separator}${idNormalized}`
    : idNormalized
  const id = createId(idNamespaced)
  const resolved = createResolved(id)
  return {
    id,
    resolved,
    separator,
    namespace: parameters.namespace ?? null,
  }
}

export const createFactory = (parameters: {
  namespace: string,
  separator?: string,
}): (...idSegments: string[]) => Identifier => {
  const { namespace, separator = defaults.seperator } = parameters

  return (...idSegments) => {
    const id = idSegments.flatMap(_ => _.split(separator)).join(separator)

    return create({
      id,
      namespace,
      separator,
    })
  }
}

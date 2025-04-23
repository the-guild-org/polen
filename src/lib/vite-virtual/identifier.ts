export interface Identifier {
  id: string
  resolved: string
  namespace: string | null
  separator: string
}

import { createId, createResolved, normalizeId } from './id.js'

export const create = (parameters: {
  id: string,
  namespace?: string,
  separator?: string,
}): Identifier => {
  const separator = parameters.separator ?? `/`
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
}): (idOrIdSegments: string | string[]) => Identifier => {
  const { namespace, separator = `/` } = parameters

  return idOrIdSegments => {
    const id = Array.isArray(idOrIdSegments)
      ? idOrIdSegments.join(separator)
      : idOrIdSegments

    return create({
      id,
      namespace,
      separator,
    })
  }
}

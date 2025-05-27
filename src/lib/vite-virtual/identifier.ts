import { createId, markNoPlugins, normalizeId } from './id.js'

export interface Options {
  /**
   * @defaultValue '/'
   */
  separator?: string
  /**
   * When false, virtual modules will be prefixed with \\0 to avoid being processed by other plugins.

   * @see https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention

   * @defaultValue false
   */
  allowPluginProcessing?: boolean
}

export interface Identifier {
  id: string
  resolved: string
  namespace: string | null
  separator: string
}

export const defaults = {
  allowPluginProcessing: false,
  separator: `/`,
} as const

export const create = (parameters: {
  id: string
  namespace?: string
  separator?: string
  allowPluginProcessing?: boolean
}): Identifier => {
  const separator = parameters.separator ?? defaults.separator
  const idNormalized = normalizeId({ id: parameters.id, separator })
  const idNamespaced = parameters.namespace
    ? `${parameters.namespace}${separator}${idNormalized}`
    : idNormalized
  const id = createId(idNamespaced)
  const resolved = parameters.allowPluginProcessing ? id : markNoPlugins(id)
  return {
    id,
    resolved,
    separator,
    namespace: parameters.namespace ?? null,
  }
}

export interface Factory {
  (idSegments: string[], options?: Options): Identifier
  /**
   * The prefix that ids returned from this factory will have.
   */
  prefix: string
  /**
   * Does the given id have a prefix that matches this factory?
   */
  includes: (id: string) => boolean
}

export const createFactory = (parameters: {
  namespace: string
  separator?: string
}): Factory => {
  const { namespace, separator = defaults.separator } = parameters

  const factory: Factory = (idSegments, options) => {
    const id = idSegments.flatMap(_ => _.split(separator)).join(separator)

    return create({
      id,
      namespace,
      separator,
      ...options,
    })
  }
  factory.prefix = createId(parameters.namespace)
  factory.includes = (id: string) => {
    return id.startsWith(factory.prefix) || id.startsWith(markNoPlugins(factory.prefix))
  }
  return factory
}

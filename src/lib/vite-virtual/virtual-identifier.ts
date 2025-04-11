import { Debug } from '../debug/_namespace.js'
import type { Vite } from '../vite/_namespace.js'

// TODO: use async hooks in debug to get namespace
const debug = Debug.create(`polen:vite:build`)

export const idPrefix = `virtual:`

export const resolvedPrefix = `\0`

const createResolved = (id: string) => `${resolvedPrefix}${id}`

const createId = (id: string) => `${idPrefix}${id}`

// todo: utility to create sub namesapces
// const virtualIdentifierAsset = (id: string) => createId(`assets/${id.replace(/^\//, ``)}`)

// const virtualIdentifierResolved = (id: string) => createResolved(createId(id))

export interface VirtualIdentifier {
  id: string
  resolved: string
  namespace: string | null
  separator: string
}

const normalizeId = (parameters: { id: string, separator?: string }) => {
  if (!parameters.separator) return parameters.id
  return parameters.id.replace(new RegExp(`^${parameters.separator}`), ``)
}

export const createNamespaceFactory = (
  namespace: string,
  separator = `/`,
): (idOrIdSegments: string | string[]) => VirtualIdentifier => {
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

const create = (parameters: {
  id: string,
  namespace?: string,
  separator?: string,
}): VirtualIdentifier => {
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

// Transformers

export const toHookResolveId = (virtualIdentifier: VirtualIdentifier): Vite.HookResolveIdFnPure => {
  return id => {
    if (id === virtualIdentifier.id) {
      return virtualIdentifier.resolved
    }
    return undefined
  }
}

export const toHookLoad = (
  virtualIdentifier: VirtualIdentifier,
  loader: Vite.HookLoadFnPure,
): Vite.HookLoadFnPure => {
  return async (...args) => {
    // debug(`load candidate`, { virtualIdentifier, args })
    if (args[0] === virtualIdentifier.resolved) {
      debug(`will load`, { virtualIdentifier })
      const result = await loader(...args)
      debug(`did load`, { virtualIdentifier, result })
      return result
    }
    return undefined
  }
}

export const toHooks = (
  virtualIdentifier: VirtualIdentifier,
  loader: Vite.HookLoadFnPure,
): Pick<Vite.Plugin, `resolveId` | `load`> => {
  return {
    resolveId: toHookResolveId(virtualIdentifier),
    load: toHookLoad(virtualIdentifier, loader),
  }
}

// Entries

export type VirtualIdentifierAndLoader = [
  virtualIdentifier: VirtualIdentifier,
  loader: Vite.HookLoadFnPure,
]

export const toHookResolveId$FromEntries = (
  virtualIdentifierToLoaderEntries: VirtualIdentifierAndLoader[],
): Vite.HookResolveIdFnPure => {
  return async (...args) => {
    const resolversStack = virtualIdentifierToLoaderEntries.map(([vi]) => toHookResolveId(vi))
    for (const resolver of resolversStack) {
      const result = await resolver(...args)
      if (result !== undefined) return result
    }
    return undefined
  }
}

export const toHookLoad$FromEntries = (
  virtualIdentifierToLoaderEntries: VirtualIdentifierAndLoader[],
): Vite.HookLoadFnPure => {
  return async (...args) => {
    const loadersStack = virtualIdentifierToLoaderEntries.map(([vi, loader]) =>
      toHookLoad(vi, loader)
    )
    for (const loader of loadersStack) {
      const result = await loader(...args)
      if (result !== undefined) return result
    }
    return undefined
  }
}

export const toHooks$FromEntries = (
  ...virtualIdentifierToLoaderEntries: VirtualIdentifierAndLoader[]
): {
  resolveId: Vite.HookResolveIdFnPure,
  load: Vite.HookLoadFnPure,
} => {
  return {
    resolveId: toHookResolveId$FromEntries(virtualIdentifierToLoaderEntries),
    load: toHookLoad$FromEntries(virtualIdentifierToLoaderEntries),
  }
}

// Map

type VirtualIdentifierToLoaderMap = Map<VirtualIdentifier, Vite.HookLoadFnPure>

export const toHookResolveId$FromMap = (
  virtualIdentifierToLoaderMap: VirtualIdentifierToLoaderMap,
): Vite.HookResolveIdFnPure =>
  toHookResolveId$FromEntries([...virtualIdentifierToLoaderMap.entries()])

export const toHooks$FromMap = (
  virtualIdentifierToLoaderMap: VirtualIdentifierToLoaderMap,
): {
  resolveId: Vite.HookResolveIdFnPure,
  load: Vite.HookLoadFnPure,
} => {
  return {
    resolveId: toHookResolveId$FromMap(virtualIdentifierToLoaderMap),
    load: toHookLoad$FromMap(virtualIdentifierToLoaderMap),
  }
}

export const toHookLoad$FromMap = (
  virtualIdentifierToLoaderMap: VirtualIdentifierToLoaderMap,
): Vite.HookLoadFnPure => toHookLoad$FromEntries([...virtualIdentifierToLoaderMap.entries()])

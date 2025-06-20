//
//
//
//
//
// Holding Module for Missing @wollybeard/kit Functionality
//
// ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//
// Code here is meant to be migrated eventually to @wollybeard/kit.
//
//
//

import { Arr, Err, Fs, Http, Path, type Ts, Undefined } from '@wollybeard/kit'
import { never } from '@wollybeard/kit/language'
import type { ResolveHookContext } from 'node:module'
import type { IsNever } from 'type-fest'

export const arrayEquals = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const ensureOptionalAbsoluteWithCwd = (pathExp: string | undefined): string => {
  if (Undefined.is(pathExp)) return process.cwd()
  return Path.ensureAbsolute(pathExp, process.cwd())
}

export const ensureOptionalAbsolute = (pathExp: string | undefined, basePathExp: string): string => {
  assertPathAbsolute(basePathExp)
  if (Undefined.is(pathExp)) return basePathExp
  return Path.ensureAbsolute(pathExp, basePathExp)
}

export const assertPathAbsolute = (pathExpression: string): void => {
  if (Path.isAbsolute(pathExpression)) return
  throw new Error(`Path must be absolute: ${pathExpression}`)
}

export const assertOptionalPathAbsolute = (pathExpression: string | undefined, message?: string): void => {
  if (Undefined.is(pathExpression)) return
  if (Path.isAbsolute(pathExpression)) return
  const message_ = message ?? `Path must be absolute: ${pathExpression}`
  throw new Error(message_)
}

export const pickFirstPathExisting = async (paths: string[]): Promise<string | undefined> => {
  const checks = await Promise.all(paths.map(path => Fs.exists(path).then(exists => exists ? path : undefined)))
  return checks.find(maybePath => maybePath !== undefined)
}

export const isSpecifierFromPackage = (specifier: string, packageName: string): boolean => {
  return specifier === packageName || specifier.startsWith(packageName + `/`)
}

export interface ImportEvent {
  specifier: string
  context: ResolveHookContext
}

// dprint-ignore
export type ObjPolicyFilter<
  $Object extends object,
  $Key extends Keyof<$Object>,
  Mode extends 'allow' | 'deny',
> = Mode extends 'allow'
      ? Pick<$Object, Extract<$Key, keyof $Object>>
      : Omit<$Object, Extract<$Key, keyof $Object>>

/**
 * Like keyof but returns PropertyKey for object
 */
type Keyof<$Object extends object> = object extends $Object ? PropertyKey : (keyof $Object)

/**
 * Filter object properties based on a policy mode and set of keys
 *
 * @param mode - 'allow' to keep only specified keys, 'deny' to remove specified keys
 * @param obj - The object to filter
 * @param keys - The keys to process
 * @returns A filtered object with proper type inference
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 }
 *
 * // Allow mode: keep only 'a' and 'c'
 * objPolicyFilter('allow', obj, ['a', 'c']) // { a: 1, c: 3 }
 *
 * // Deny mode: remove 'a' and 'c'
 * objPolicyFilter('deny', obj, ['a', 'c']) // { b: 2 }
 * ```
 */
export const objPolicyFilter = <
  obj extends object,
  keyUnion extends Keyof<obj>,
  mode extends 'allow' | 'deny',
>(
  mode: mode,
  obj: obj,
  keys: readonly keyUnion[],
): ObjPolicyFilter<obj, keyUnion, mode> => {
  const result: any = mode === 'deny' ? { ...obj } : {}

  if (mode === 'allow') {
    // For allow mode, only add specified keys
    for (const key of keys) {
      if (key in obj) {
        // @ts-expect-error
        result[key] = obj[key]
      }
    }
  } else {
    // For deny mode, remove specified keys
    for (const key of keys) {
      delete result[key]
    }
  }

  return result
}

/**
 * Filter an object using a predicate function
 *
 * @param obj - The object to filter
 * @param predicate - Function that returns true to keep a key/value pair
 * @returns A new object with only the key/value pairs where predicate returned true
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 }
 * objFilter(obj, (k, v) => v > 1) // { b: 2, c: 3 }
 * objFilter(obj, k => k !== 'b') // { a: 1, c: 3 }
 * ```
 */
export const objFilter = <T extends object>(
  obj: T,
  predicate: (key: keyof T, value: T[keyof T], obj: T) => boolean,
): Partial<T> => {
  const result = {} as Partial<T>
  for (const key in obj) {
    if (predicate(key, obj[key], obj)) {
      result[key] = obj[key]
    }
  }
  return result
}

export const ObjPick = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
  return objPolicyFilter('allow', obj, keys) as any
}

export const ObjOmit = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> => {
  return objPolicyFilter('deny', obj, keys) as any
}

export const ObjPartition = <T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): { omitted: Omit<T, K>; picked: Pick<T, K> } => {
  return keys.reduce((acc, key) => {
    if (key in acc.omitted) {
      // @ts-expect-error omitted already at type level
      delete acc.omitted[key]
      acc.picked[key] = obj[key]
    }
    return acc
  }, {
    omitted: { ...obj } as Omit<T, K>,
    picked: {} as Pick<T, K>,
  })
}

export const ensureEnd = (string: string, ending: string) => {
  if (string.endsWith(ending)) return string
  return string + ending
}

export const ResponseInternalServerError = () =>
  new Response(null, {
    status: Http.Status.InternalServerError.code,
    statusText: Http.Status.InternalServerError.description,
  })

/**
 * Execute an operation on multiple items, continuing even if some fail
 */
export async function tryCatchMany<item, result>(
  items: item[],
  operation: (item: item) => Promise<result>,
): Promise<[result[], (Error & { context: { item: item } })[]]> {
  const partitionedResults = await Promise.all(items.map(async (item) => {
    const result = await Err.tryCatch(() => operation(item))
    if (Err.is(result)) {
      const error = result as Error & { context: { item: item } }
      error.context = { item }
      return error
    }
    return result
  })).then(Arr.partitionErrors)
  return partitionedResults as any
}

/**
 * Type-level helper to check if two types are exactly the same (invariant).
 */
export type IsExact<T, U> = T extends U ? U extends T ? true : false : false

// dprint-ignore
export type ExtendsExact<$Input, $Constraint> =
  $Input extends $Constraint
    ? $Constraint extends $Input
      ? $Input
      : never
  : never

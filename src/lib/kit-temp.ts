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

import { Arr, Err, Fs, Http, Path, Undefined } from '@wollybeard/kit'
import type { ResolveHookContext } from 'node:module'

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
  Mode extends `allow` | `deny`,
> = Mode extends `allow`
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
  mode extends `allow` | `deny`,
>(
  mode: mode,
  obj: obj,
  keys: readonly keyUnion[],
): ObjPolicyFilter<obj, keyUnion, mode> => {
  const result: any = mode === `deny` ? { ...obj } : {}

  if (mode === `allow`) {
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
  // Use Object.keys to get all enumerable own properties
  // This matches the behavior of for...in but only for own properties
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (predicate(key, obj[key], obj)) {
      result[key] = obj[key]
    }
  }
  return result
}

export const ObjPick = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
  return objPolicyFilter(`allow`, obj, keys) as any
}

export const ObjOmit = <T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> => {
  return objPolicyFilter(`deny`, obj, keys) as any
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

/**
 * Create a generic cache with clear interface
 */
export const createCache = <T>() => {
  const cache = new Map<string, T>()
  return {
    has: (key: string) => cache.has(key),
    get: (key: string) => cache.get(key),
    set: (key: string, value: T) => cache.set(key, value),
    clear: () => cache.clear(),
  }
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

/**
 * Split an array into chunks of specified size
 *
 * @param array - The array to chunk
 * @param size - The size of each chunk
 * @returns Array of chunks
 *
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * chunk(['a', 'b', 'c'], 3) // [['a', 'b', 'c']]
 * ```
 */
export const chunk = <T>(array: readonly T[], size: number): T[][] => {
  if (size <= 0) throw new Error(`Chunk size must be greater than 0`)
  if (array.length === 0) return []

  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export interface AsyncParallelOptions {
  /**
   * Maximum number of items to process concurrently
   * @default 10
   */
  concurrency?: number

  /**
   * If true, stops processing on first error
   * If false, continues processing all items even if some fail
   * @default false
   */
  failFast?: boolean

  /**
   * Size of batches to process items in
   * If not specified, all items are processed with the specified concurrency
   */
  batchSize?: number
}

export interface AsyncParallelResult<T, R> {
  /** Successfully processed results */
  results: R[]
  /** Errors that occurred during processing */
  errors: (Error & { item: T })[]
  /** Whether all items were processed successfully */
  success: boolean
}

/**
 * Process items in parallel with configurable options
 *
 * @param items - Items to process
 * @param operation - Async function to apply to each item (with optional index)
 * @param options - Configuration options
 * @returns Results and errors from processing
 *
 * @example
 * ```ts
 * const items = [1, 2, 3, 4, 5]
 * const result = await asyncParallel(items, async (n, index) => n * 2, {
 *   concurrency: 2,
 *   batchSize: 3,
 *   failFast: false
 * })
 * // result.results: [2, 4, 6, 8, 10]
 * // result.errors: []
 * // result.success: true
 * ```
 */
export const asyncParallel = async <T, R>(
  items: readonly T[],
  operation: (item: T, index: number) => Promise<R>,
  options: AsyncParallelOptions = {},
): Promise<AsyncParallelResult<T, R>> => {
  const { concurrency = 10, failFast = false, batchSize } = options

  if (items.length === 0) {
    return { results: [], errors: [], success: true }
  }

  const allResults: R[] = []
  const allErrors: (Error & { item: T })[] = []

  // If batchSize is specified, process in batches
  if (batchSize !== undefined) {
    const batches = chunk(items, batchSize)
    let globalIndex = 0

    for (const batch of batches) {
      const batchResult = await processBatch(batch, operation, concurrency, failFast, globalIndex)
      allResults.push(...batchResult.results)
      allErrors.push(...batchResult.errors)
      globalIndex += batch.length

      if (failFast && batchResult.errors.length > 0) {
        break
      }
    }
  } else {
    // Process all items with specified concurrency
    const result = await processBatch(items, operation, concurrency, failFast, 0)
    allResults.push(...result.results)
    allErrors.push(...result.errors)
  }

  return {
    results: allResults,
    errors: allErrors,
    success: allErrors.length === 0,
  }
}

/**
 * Process a batch of items with limited concurrency
 */
const processBatch = async <T, R>(
  items: readonly T[],
  operation: (item: T, index: number) => Promise<R>,
  concurrency: number,
  failFast: boolean,
  startIndex = 0,
): Promise<AsyncParallelResult<T, R>> => {
  const results: R[] = []
  const errors: (Error & { item: T })[] = []

  // Process items in chunks based on concurrency limit
  const chunks = chunk(items, concurrency)
  let currentIndex = startIndex

  for (const chunkItems of chunks) {
    const promises = chunkItems.map(async (item, chunkIndex) => {
      const globalIndex = currentIndex + chunkIndex
      try {
        const result = await operation(item, globalIndex)
        return { success: true, result, item }
      } catch (error) {
        const enhancedError = error instanceof Error ? error : new Error(String(error))
        Object.assign(enhancedError, { item })
        return { success: false, error: enhancedError as Error & { item: T }, item }
      }
    })

    currentIndex += chunkItems.length

    const chunkResults = await Promise.allSettled(promises)

    for (const promiseResult of chunkResults) {
      if (promiseResult.status === `fulfilled`) {
        const { success, result, error, item } = promiseResult.value
        if (success) {
          results.push(result!)
        } else {
          errors.push(error!)
          if (failFast) {
            return { results, errors, success: false }
          }
        }
      } else {
        // This shouldn't happen since we're catching errors above
        // But handle it just in case
        const error = new Error(`Unexpected promise rejection`) as Error & { item: any }
        errors.push(error)
        if (failFast) {
          return { results, errors, success: false }
        }
      }
    }
  }

  return { results, errors, success: errors.length === 0 }
}

// /**
//  * Reduce an array asynchronously, processing each item in sequence
//  *
//  * @param items - Array of items to process
//  * @param reducer - Async function that takes accumulator and current item
//  * @param initial - Initial value for the accumulator
//  * @returns Final accumulated value
//  *
//  * @example
//  * ```ts
//  * const numbers = [1, 2, 3, 4]
//  * const sum = await asyncReduce(numbers, async (acc, n) => acc + n, 0)
//  * // sum: 10
//  *
//  * const transforms = [addHeader, addFooter, minify]
//  * const html = await asyncReduce(transforms, async (html, transform) => transform(html), initialHtml)
//  * ```
//  */
// export const asyncReduce = async <T, R>(
//   items: readonly T[],
//   reducer: (accumulator: R, current: T, index: number) => Promise<R> | R,
//   initial: R,
// ): Promise<R> => {
//   let result = initial
//   for (let i = 0; i < items.length; i++) {
//     const item = items[i]!
//     result = await reducer(result, item, i)
//   }
//   return result
// }

// /**
//  * Curried version of asyncReduce for functions that transform a value
//  *
//  * @param transformers - Array of transformer functions
//  * @returns A function that takes an initial value and applies all transformers
//  *
//  * @example
//  * ```ts
//  * const transformers = [addHeader, addFooter, minify]
//  * const applyTransforms = asyncReduceWith(transformers)
//  * const finalHtml = await applyTransforms(initialHtml)
//  *
//  * // For simple pipelines where each function transforms the same type
//  * const htmlPipeline = asyncReduceWith([
//  *   (html) => html.replace('foo', 'bar'),
//  *   async (html) => await prettify(html),
//  *   (html) => html.trim()
//  * ])
//  * ```
//  */
// export const asyncReduceWith = <T>(
//   transformers: readonly ((value: T) => Promise<T> | T)[],
// ) => {
//   return async (initial: T): Promise<T> => {
//     return asyncReduce(transformers, (value, transform) => transform(value), initial)
//   }
// }

/**
 * Reduce an array asynchronously with context, processing each item in sequence
 *
 * @param items - Array of items to process
 * @param reducer - Async function that takes accumulator, current item, and context
 * @param initial - Initial value for the accumulator
 * @param context - Context object passed to each reducer call
 * @returns Final accumulated value
 *
 * @example
 * ```ts
 * const transformers = [transformer1, transformer2]
 * const ctx = { request: req, response: res }
 * const result = await asyncReduceWithContext(
 *   transformers,
 *   async (html, transformer) => transformer(html, ctx),
 *   initialHtml,
 *   ctx
 * )
 * ```
 */
export const asyncReduce = async <T, R, C>(
  items: readonly T[],
  reducer: (accumulator: R, current: T, context: C, index: number) => Promise<R> | R,
  initial: R,
  context: C,
): Promise<R> => {
  let result = initial
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    result = await reducer(result, item, context, i)
  }
  return result
}

/**
 * Curried version of asyncReduceWithContext for functions that transform a value with context
 *
 * @param transformers - Array of transformer functions that take value and context
 * @returns A function that takes an initial value and context, and applies all transformers
 *
 * @example
 * ```ts
 * const transformers = [
 *   (html, ctx) => html.replace('{{url}}', ctx.req.url),
 *   async (html, ctx) => await ctx.minify(html),
 * ]
 * const applyTransforms = asyncReduceWithContextWith(transformers)
 * const finalHtml = await applyTransforms(initialHtml, ctx)
 * ```
 */
export const asyncReduceWith = <T, C>(
  transformers: readonly ((value: T, context: C) => Promise<T> | T)[],
  context: C,
) => {
  return async (initial: T): Promise<T> => {
    return asyncReduce(
      transformers,
      (value, transform, ctx) => transform(value, ctx),
      initial,
      context,
    )
  }
}

/**
 * Create a branded type that provides nominal typing in TypeScript.
 *
 * Branded types allow you to create distinct types from primitives or other types,
 * preventing accidental mixing of values that are structurally identical but
 * semantically different.
 *
 * @template $BaseType - The underlying type to brand (e.g., string, number)
 * @template $BrandName - A unique string literal to distinguish this brand
 *
 * @example
 * ```ts
 * // Create distinct ID types that can't be mixed
 * type UserId = Brand<string, 'UserId'>
 * type PostId = Brand<string, 'PostId'>
 *
 * function getUser(id: UserId) { ... }
 *
 * const userId = 'u123' as UserId
 * const postId = 'p456' as PostId
 *
 * getUser(userId)  // ✓ OK
 * getUser(postId)  // ✗ Type error - can't use PostId where UserId expected
 * ```
 *
 * @example
 * ```ts
 * // Brand primitive types for domain modeling
 * type Email = Brand<string, 'Email'>
 * type Url = Brand<string, 'Url'>
 * type PositiveNumber = Brand<number, 'PositiveNumber'>
 * ```
 */
export type Brand<$BaseType, $BrandName extends string> =
  & $BaseType
  & {
    readonly __brand: $BrandName
  }

/**
 * Helper function to create a branded value.
 *
 * This is a simple type assertion helper. For runtime validation,
 * combine with validation functions or schemas.
 *
 * @template $BaseType - The underlying type to brand
 * @template $BrandName - The brand name to apply
 * @param value - The value to brand
 * @returns The value with the brand type applied
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>
 *
 * // Simple branding (no runtime validation)
 * const id = brand<string, 'UserId'>('u123')
 *
 * // With validation (recommended)
 * function createUserId(value: string): UserId {
 *   if (!value.startsWith('u')) {
 *     throw new Error('User IDs must start with "u"')
 *   }
 *   return brand<string, 'UserId'>(value)
 * }
 * ```
 */
export const brand = <$BaseType, $BrandName extends string>(
  value: $BaseType,
): Brand<$BaseType, $BrandName> => {
  return value as Brand<$BaseType, $BrandName>
}

/**
 * Shallow merge objects while omitting undefined values.
 *
 * This utility simplifies the common pattern of conditionally spreading objects
 * to avoid including undefined values that would override existing values.
 *
 * @param objects - Objects to merge (later objects override earlier ones). Undefined objects are ignored.
 * @returns Merged object with undefined values omitted
 *
 * @example
 * ```ts
 * // Instead of:
 * const overrides = {
 *   ...(value1 ? { key1: value1 } : {}),
 *   ...(value2 ? { key2: value2 } : {}),
 * }
 *
 * // Use:
 * const overrides = mergeShallow({
 *   key1: value1,
 *   key2: value2,
 * })
 *
 * // Example with config merging:
 * const config = mergeShallow(
 *   defaultConfig,
 *   userConfig,
 *   { debug: args.debug, base: args.base }
 * )
 * // undefined values in the last object won't override earlier values
 * ```
 */
export const spreadShallow = <T extends object>(...objects: (T | undefined)[]): T => {
  const result = {} as T

  for (const obj of objects) {
    if (obj === undefined) continue

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        if (value !== undefined) {
          result[key] = value
        }
      }
    }
  }

  return result
}

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

import { FileSystem } from '@effect/platform'
import { Arr, Err, Fs, Http, Path, Undefined } from '@wollybeard/kit'
import { dump } from '@wollybeard/kit/debug'
import { Effect } from 'effect'
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

export const pickFirstPathExisting = (
  paths: string[],
): Effect.Effect<string | undefined, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Check each path for existence
    const checks = yield* Effect.all(
      paths.map(path =>
        fs.exists(path).pipe(
          Effect.map(exists => exists ? path : undefined),
          Effect.mapError(error => new Error(`Failed to check path existence: ${path} - ${error}`)),
        )
      ),
    )

    // Return the first existing path
    return checks.find(maybePath => maybePath !== undefined)
  })

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
    // For allow mode, only add specified keys that are own properties
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
export const createCache = <$T>() => {
  const cache = new Map<string, $T>()
  return {
    has: (key: string) => cache.has(key),
    get: (key: string) => cache.get(key),
    set: (key: string, value: $T) => cache.set(key, value),
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
 * Effect-based version with proper error handling and concurrency control
 */
export const tryCatchMany = <item, result, E = never, R = never>(
  items: readonly item[],
  operation: (item: item) => Effect.Effect<result, E, R>,
): Effect.Effect<[result[], (Error & { context: { item: item } })[], { success: boolean }], never, R> =>
  Effect.gen(function*() {
    const results = yield* Effect.all(
      items.map(item =>
        Effect.gen(function*() {
          const result = yield* Effect.either(operation(item))
          if (result._tag === 'Left') {
            const error = result.left instanceof Error ? result.left : new Error(String(result.left))
            const enhancedError = error as Error & { context: { item: item } }
            enhancedError.context = { item }
            return enhancedError
          }
          return result.right
        })
      ),
      { concurrency: 'unbounded' },
    )

    // Manually partition results to ensure proper typing
    const successes: result[] = []
    const failures: (Error & { context: { item: item } })[] = []

    for (const result of results) {
      if (result instanceof Error) {
        failures.push(result as Error & { context: { item: item } })
      } else {
        successes.push(result as result)
      }
    }

    return [successes, failures, { success: failures.length === 0 }] as const
  })

/**
 * Legacy Promise-based wrapper for backward compatibility
 * @deprecated Use the Effect-based version
 */
export async function tryCatchManyAsync<item, result>(
  items: item[],
  operation: (item: item) => Promise<result>,
): Promise<[result[], (Error & { context: { item: item } })[]]> {
  const effectOperation = (item: item) => Effect.tryPromise(() => operation(item))
  const [results, errors] = await Effect.runPromise(tryCatchMany(items, effectOperation))
  return [results, errors]
}

/**
 * Type-level helper to check if two types are exactly the same (invariant).
 */
export type IsExact<$T, $U> = $T extends $U ? $U extends $T ? true : false : false

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

export interface EffectParallelOptions {
  /**
   * Maximum number of items to process concurrently
   * @default 10
   */
  concurrency?: number | 'unbounded'

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

export interface EffectParallelResult<$T, $R> {
  /** Successfully processed results */
  results: $R[]
  /** Errors that occurred during processing */
  errors: (Error & { item: $T })[]
  /** Whether all items were processed successfully */
  success: boolean
}

/** @deprecated Use EffectParallelOptions */
export type AsyncParallelOptions = EffectParallelOptions

/** @deprecated Use EffectParallelResult */
export type AsyncParallelResult<$T, $R> = EffectParallelResult<$T, $R>

/**
 * Process items in parallel with configurable options using Effect
 *
 * @param items - Items to process
 * @param operation - Effect function to apply to each item (with optional index)
 * @param options - Configuration options
 * @returns Results and errors from processing
 *
 * @example
 * ```ts
 * const items = [1, 2, 3, 4, 5]
 * const result = await Effect.runPromise(
 *   effectParallel(items, (n, index) => Effect.succeed(n * 2), {
 *     concurrency: 2,
 *     batchSize: 3,
 *     failFast: false
 *   })
 * )
 * // result.results: [2, 4, 6, 8, 10]
 * // result.errors: []
 * // result.success: true
 * ```
 */
export const effectParallel = <T, R, E = never, Context = never>(
  items: readonly T[],
  operation: (item: T, index: number) => Effect.Effect<R, E, Context>,
  options: EffectParallelOptions = {},
): Effect.Effect<EffectParallelResult<T, R>, never, Context> =>
  Effect.gen(function*() {
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
        const batchResult = yield* processEffectBatch(batch, operation, concurrency, failFast, globalIndex)
        allResults.push(...batchResult.results)
        allErrors.push(...batchResult.errors)
        globalIndex += batch.length

        if (failFast && batchResult.errors.length > 0) {
          break
        }
      }
    } else {
      // Process all items with specified concurrency
      const result = yield* processEffectBatch(items, operation, concurrency, failFast, 0)
      allResults.push(...result.results)
      allErrors.push(...result.errors)
    }

    return {
      results: allResults,
      errors: allErrors,
      success: allErrors.length === 0,
    }
  })

/**
 * Legacy Promise-based version for backward compatibility
 * @deprecated Use effectParallel with Effect.runPromise
 */
export const asyncParallel = async <T, R>(
  items: readonly T[],
  operation: (item: T, index: number) => Promise<R>,
  options: AsyncParallelOptions = {},
): Promise<AsyncParallelResult<T, R>> => {
  const effectOperation = (item: T, index: number) => Effect.tryPromise(() => operation(item, index))
  return Effect.runPromise(effectParallel(items, effectOperation, options))
}

/**
 * Process a batch of items with limited concurrency using Effect
 */
const processEffectBatch = <T, R, E, Context>(
  items: readonly T[],
  operation: (item: T, index: number) => Effect.Effect<R, E, Context>,
  concurrency: number | 'unbounded',
  failFast: boolean,
  startIndex = 0,
): Effect.Effect<EffectParallelResult<T, R>, never, Context> =>
  Effect.gen(function*() {
    const results: R[] = []
    const errors: (Error & { item: T })[] = []

    if (concurrency === 'unbounded') {
      // Process all items concurrently without limit
      const itemEffects = items.map((item, index) =>
        Effect.gen(function*() {
          const globalIndex = startIndex + index
          const result = yield* Effect.either(operation(item, globalIndex))
          if (result._tag === 'Left') {
            const error = result.left instanceof Error ? result.left : new Error(String(result.left))
            const enhancedError = error as Error & { item: T }
            enhancedError.item = item
            return { success: false as const, error: enhancedError, item }
          }
          return { success: true as const, result: result.right, item }
        })
      )

      const chunkResults = yield* Effect.all(itemEffects, { concurrency: 'unbounded' })

      for (const itemResult of chunkResults) {
        if (itemResult.success) {
          results.push(itemResult.result)
        } else {
          errors.push(itemResult.error)
          if (failFast) {
            return { results, errors, success: false }
          }
        }
      }
    } else {
      // Process items in chunks based on concurrency limit
      const chunks = chunk(items, concurrency)
      let currentIndex = startIndex

      for (const chunkItems of chunks) {
        const itemEffects = chunkItems.map((item, chunkIndex) =>
          Effect.gen(function*() {
            const globalIndex = currentIndex + chunkIndex
            const result = yield* Effect.either(operation(item, globalIndex))
            if (result._tag === 'Left') {
              const error = result.left instanceof Error ? result.left : new Error(String(result.left))
              const enhancedError = error as Error & { item: T }
              enhancedError.item = item
              return { success: false as const, error: enhancedError, item }
            }
            return { success: true as const, result: result.right, item }
          })
        )

        currentIndex += chunkItems.length

        const chunkResults = yield* Effect.all(itemEffects, { concurrency: 'unbounded' })

        for (const itemResult of chunkResults) {
          if (itemResult.success) {
            results.push(itemResult.result)
          } else {
            errors.push(itemResult.error)
            if (failFast) {
              return { results, errors, success: false }
            }
          }
        }
      }
    }

    return { results, errors, success: errors.length === 0 }
  })

/**
 * Legacy Promise-based batch processor for backward compatibility
 * @deprecated Use processEffectBatch
 */
const processBatch = async <T, R>(
  items: readonly T[],
  operation: (item: T, index: number) => Promise<R>,
  concurrency: number,
  failFast: boolean,
  startIndex = 0,
): Promise<AsyncParallelResult<T, R>> => {
  const effectOperation = (item: T, index: number) => Effect.tryPromise(() => operation(item, index))
  return Effect.runPromise(processEffectBatch(items, effectOperation, concurrency, failFast, startIndex))
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

// Utility type for non-empty arrays
export type NonEmptyArray<$T> = [$T, ...$T[]]

/**
 * Extract primitive fields that can be used in dehydrated forms
 */
export type PrimitiveFieldKeys<$T> = {
  [K in keyof $T]: $T[K] extends string | number | boolean | bigint | null | undefined ? K
    : $T[K] extends Date ? K
    : never
}[keyof $T]

export type Case<$Result extends true> = $Result
export type CaseTrue<$Result extends true> = $Result
export type CaseFalse<$Result extends false> = $Result
export type CaseNumber<$Result extends number> = $Result
export type CaseString<$Result extends string> = $Result
export type CaseBigint<$Result extends bigint> = $Result
export type CaseNever<$Result extends never> = $Result

export type ObjReplace<$Object1, $Object2> = Omit<$Object1, keyof $Object2> & $Object2

export const zz = (...args: any[]) => {
  console.log('---------------------------------------------')
  console.log(...args)
  console.log('---------------------------------------------')
}

export const zd = (...args: any) => {
  console.log('---------------------------------------------')
  args.forEach(dump)
  console.log('---------------------------------------------')
}

/**
 * Filter object properties by key pattern matching
 *
 * @param obj - The object to filter
 * @param predicate - Function that returns true to keep a key
 * @returns A new object with only the key/value pairs where key predicate returned true
 *
 * @example
 * ```ts
 * const props = { 'data-type': 'button', 'data-current': true, onClick: fn, className: 'btn' }
 * const dataAttrs = pickMatching(props, key => key.startsWith('data-'))
 * // { 'data-type': 'button', 'data-current': true }
 * ```
 */
export const pickMatching = <T extends object>(
  obj: T,
  predicate: (key: keyof T) => boolean,
): Partial<T> => {
  const result = {} as Partial<T>
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (predicate(key)) {
      result[key] = obj[key]
    }
  }
  return result
}

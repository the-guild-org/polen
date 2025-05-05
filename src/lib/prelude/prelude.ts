export const includesUnknown = <T>(array: T[], value: unknown): value is T =>
  array.includes(value as any)

export const entries = <T extends Record<string, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][]

export const arrayify = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [value]

export const casesHandled = (value: never) => {
  throw new Error(`Case not handled: ${String(value)}`)
}

export const titleCase = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase())

export * as Fn from './fn.js'

export * as Undefined from './Undefined.js'

export * as TypeGuard from './type-guard.js'

export const isPlainObject = (value: unknown) => typeof value === `object` && value !== null

export const partitionOne = <item, itemSub extends item>(
  items: item[],
  predicate: (value: item) => value is itemSub,
): [Exclude<item, itemSub>[], itemSub | null] => {
  const [itemsA, itemsB] = partition(items, predicate)
  if (itemsB.length > 1) throw new Error(`Expected at most one item to match predicate`)

  return [itemsA, itemsB[0] ?? null]
}

export const partition = <item, itemSub extends item>(
  items: item[],
  predicate: (value: item) => value is itemSub,
): [Exclude<item, itemSub>[], itemSub[]] => {
  const itemsA: Exclude<item, itemSub>[] = []
  const itemsB: itemSub[] = []

  for (const value of items) {
    if (predicate(value)) itemsB.push(value)
    else itemsA.push(value as Exclude<item, itemSub>)
  }

  return [itemsA, itemsB]
}

export const isRecordLikeObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === `object` && value !== null && !Array.isArray(value)
}

export const partitionErrors = <T>(array: T[]): [Exclude<T, Error>[], Extract<T, Error>[]] => {
  const errors: Extract<T, Error>[] = []
  const values: Exclude<T, Error>[] = []
  for (const item of array) {
    if (item instanceof Error) {
      errors.push(item as any)
    } else {
      values.push(item as any)
    }
  }
  return [values, errors]
}

export const isString = (value: unknown): value is string => typeof value === `string`

export type NonEmptyArray<T> = [T, ...T[]]

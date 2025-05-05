export const ensure = <value>(value: value): FlattenShallow<value>[] => {
  return Array.isArray(value) ? value : [value as any]
}

export type FlattenShallow<$Type> = $Type extends (infer __inner_type__)[] ? __inner_type__ : $Type

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

export type NonEmpty<T> = [T, ...T[]]

export const isEmpty = (array: unknown[]): array is [] => array.length === 0

export const isNotEmpty = <T>(
  array: T[],
): array is NonEmpty<T> => {
  return array.length > 0
}

export const mapNonEmptyArray = <nonEmptyArray extends NonEmpty<any>, T2>(
  nonEmptyArray: nonEmptyArray,
  fn: (value: nonEmptyArray[number]) => T2,
): NonEmpty<T2> => {
  return nonEmptyArray.map(fn) as NonEmpty<T2>
}

export const map = <array extends any[], newType>(
  array: array,
  fn: (value: array[number], index: number) => newType,
): array extends NonEmpty<any> ? NonEmpty<newType> : newType[] => {
  return array.map(fn) as any
}

export const includesUnknown = <T>(array: T[], value: unknown): value is T => {
  return array.includes(value as any)
}

export type Maybe<$Type> = $Type | $Type[]

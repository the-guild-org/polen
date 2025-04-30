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

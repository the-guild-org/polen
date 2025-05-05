export const entries = <T extends Record<string, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][]

export const casesHandled = (value: never) => {
  throw new Error(`Case not handled: ${String(value)}`)
}

export * as Arr from './arr-2.js'

export * as Str from './Str.js'

export * as Fn from './fn.js'

export * as Undefined from './Undefined.js'

export * as TypeGuard from './type-guard.js'

export const isPlainObject = (value: unknown) => typeof value === `object` && value !== null

export const isRecordLikeObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === `object` && value !== null && !Array.isArray(value)
}

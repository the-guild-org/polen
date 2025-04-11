export const includesUnknown = <T>(array: T[], value: unknown): value is T =>
  array.includes(value as any)

export const entries = <T extends Record<string, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][]

export const arrayify = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [value]

export const casesHandled = (value: never) => {
  throw new Error(`Case not handled: ${String(value)}`)
}

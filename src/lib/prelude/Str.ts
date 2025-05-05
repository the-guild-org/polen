export const is = (value: unknown): value is string => typeof value === `string`

export const titleCase = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase())

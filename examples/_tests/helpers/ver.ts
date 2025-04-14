import { z } from 'zod'

export const npmVerPattern = /^npm:(.+)$/

export type Ver = (typeof VerEnum)[keyof typeof VerEnum] | `npm:${string}`

export const VerEnum = {
  link: `link`,
  file: `file`,
} as const

export const Ver = z.union([
  z.literal(VerEnum.link),
  z.literal(VerEnum.file),
  z.string().regex(npmVerPattern),
]).transform(v => v as Ver)

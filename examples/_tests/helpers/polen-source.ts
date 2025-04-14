import { z } from 'zod'

export const PolenSourceEnum = {
  localLink: `localLink`,
  localFile: `localFile`,
  registry: `registry`,
} as const

export type PolenSource = (typeof PolenSourceEnum)[keyof typeof PolenSourceEnum]

export const PolenSource = z.nativeEnum(PolenSourceEnum)

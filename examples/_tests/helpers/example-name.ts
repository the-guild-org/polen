import { z } from 'zod'

export const ExampleNameEnum = {
  basic: `basic`,
  github: `github`,
} as const

export type ExampleName = (typeof ExampleNameEnum)[keyof typeof ExampleNameEnum]

export const ExampleName = z.nativeEnum(ExampleNameEnum)

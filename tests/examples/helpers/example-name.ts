import { z } from 'zod'

export const ExampleNameEnum = {
  pokemon: `pokemon`,
  github: `github`,
  hive: `hive`,
} as const

export type ExampleName = (typeof ExampleNameEnum)[keyof typeof ExampleNameEnum]

export const ExampleName = z.nativeEnum(ExampleNameEnum)

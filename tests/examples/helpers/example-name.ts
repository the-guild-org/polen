import { z } from 'zod'

export const ExampleNameEnum = {
  hive: `hive`,
} as const

export type ExampleName = (typeof ExampleNameEnum)[keyof typeof ExampleNameEnum]

export const ExampleName = z.nativeEnum(ExampleNameEnum)

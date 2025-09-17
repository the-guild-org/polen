import * as S from 'effect/Schema'

export namespace ExampleName {
  export const ExampleName = S.Enums(
    {
      hive: `hive`,
    } as const,
  )

  export type ExampleName = S.Schema.Type<typeof ExampleName>

  export const decodeSync = S.decodeUnknownSync(ExampleName)
}

import { S } from '#dep/effect'

export const Placement = S.Enums(
  {
    before: 'before',
    after: 'after',
    over: 'over',
  } as const,
)

export type Placement = S.Schema.Type<typeof Placement>

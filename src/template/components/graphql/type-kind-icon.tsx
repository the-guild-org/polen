import type { React } from '#dep/react'
import type { Grafaid } from '#lib/grafaid'
import { Code } from '@radix-ui/themes'
import { typeKindTokensIndex, unknownTypeKindToken } from './type-kind-tokens.ts'

export const TypeKindIcon: React.FC<{ kind: Grafaid.Schema.TypeKindName }> = ({ kind }) => {
  // eslint-disable-next-line
  const { symbol, color } = typeKindTokensIndex[kind] ?? unknownTypeKindToken

  return <Code color={color} weight='bold' variant='outline'>{symbol}</Code>
}

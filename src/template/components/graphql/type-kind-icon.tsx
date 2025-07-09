import type { React } from '#dep/react/index'
import type { Grafaid } from '#lib/grafaid/index'
import { Code } from '@radix-ui/themes'
import { typeKindTokensIndex, unknownTypeKindToken } from './type-kind-tokens.js'

export const TypeKindIcon: React.FC<{ kind: Grafaid.Schema.TypeKindName }> = ({ kind }) => {
  const { symbol, color } = typeKindTokensIndex[kind] ?? unknownTypeKindToken

  return <Code color={color} weight='bold' variant='outline'>{symbol}</Code>
}

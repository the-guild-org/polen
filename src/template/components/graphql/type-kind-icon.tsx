import type { React } from '#dep/react/index'
import { Code } from '@radix-ui/themes'
import type { Grafaid } from 'graphql-kit'
import { typeKindTokensIndex, unknownTypeKindToken } from './type-kind-tokens.js'

export const TypeKindIcon: React.FC<{ kind: Grafaid.Schema.TypeKindName }> = ({ kind }) => {
  const { symbol, color } = typeKindTokensIndex[kind] ?? unknownTypeKindToken

  return <Code color={color} weight='bold' variant='outline'>{symbol}</Code>
}

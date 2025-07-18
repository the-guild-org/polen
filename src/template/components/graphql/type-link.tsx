import { Grafaid } from '#lib/grafaid'
import { Code, Flex } from '@radix-ui/themes'
import { ReferenceLink } from '../ReferenceLink.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

export const TypeLink: React.FC<{ type: Grafaid.Schema.TypesLike.Named }> = ({ type }) => {
  const kind = Grafaid.Schema.typeKindFromClass(type)

  return (
    <ReferenceLink type={type.name}>
      <Flex align='center' gap='1' display='inline-flex'>
        <TypeKindIcon kind={kind} />
        {` `}
        <Code color={typeKindTokensIndex[kind].color} variant='ghost'>{type.name}</Code>
      </Flex>
    </ReferenceLink>
  )
}

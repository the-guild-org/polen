import { Grafaid } from '#lib/grafaid'
import { Code, Flex } from '@radix-ui/themes'
import { Link } from '../Link.jsx'
import { TypeKindIcon } from './graphql.jsx'
import { typeKindTokensIndex } from './type-kind-tokens.ts'

export const TypeLink: React.FC<{ type: Grafaid.Schema.TypesLike.Named }> = ({ type }) => {
  const kind = Grafaid.Schema.typeKindFromClass(type)
  return (
    <Link to={`/reference/${type.name}`}>
      <Flex align='center' gap='1' display='inline-flex'>
        <TypeKindIcon kind={kind} />
        {` `}
        <Code color={typeKindTokensIndex[kind].color} variant='ghost'>{type.name}</Code>
      </Flex>
    </Link>
  )
}

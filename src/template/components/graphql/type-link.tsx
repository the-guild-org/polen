import { Grafaid } from '#lib/grafaid/index'
import { Code, Flex } from '@radix-ui/themes'
import { useVersionPath } from '../../hooks/useVersionPath.js'
import { Link } from '../Link.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

export const TypeLink: React.FC<{ type: Grafaid.Schema.TypesLike.Named }> = ({ type }) => {
  const kind = Grafaid.Schema.typeKindFromClass(type)
  const versionPath = useVersionPath()

  return (
    <Link to={`/reference/${versionPath}${type.name}`}>
      <Flex align='center' gap='1' display='inline-flex'>
        <TypeKindIcon kind={kind} />
        {` `}
        <Code color={typeKindTokensIndex[kind].color} variant='ghost'>{type.name}</Code>
      </Flex>
    </Link>
  )
}

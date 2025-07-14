import { Grafaid } from '#lib/grafaid/index'
import { Code, Flex } from '@radix-ui/themes'
import { useParams } from 'react-router'
import { Link } from '../Link.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

export const TypeLink: React.FC<{ type: Grafaid.Schema.TypesLike.Named }> = ({ type }) => {
  const params = useParams()
  const kind = Grafaid.Schema.typeKindFromClass(type)
  
  // Preserve version in the URL if present
  const versionPath = params[`version`] ? `${params[`version`]}/` : ``
  
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

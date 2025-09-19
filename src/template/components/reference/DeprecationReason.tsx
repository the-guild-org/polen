import type { React } from '#dep/react/index'
import type { GrafaidOld } from 'graphql-kit'
import { Markdown } from '../Markdown.js'
import { Text } from '../ui/index.js'

export const DeprecationReason: React.FC<{ data: GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as='div' color='red'>
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

import type { React } from '#dep/react/index'
import { Text } from '@radix-ui/themes'
import type { GrafaidOld } from 'graphql-kit'
import { Markdown } from '../Markdown.js'

export const DeprecationReason: React.FC<{ data: GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as='div' color='red'>
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

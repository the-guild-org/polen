import type { React } from '#dep/react/index'
import { Text } from '@radix-ui/themes'
import { Markdown } from './Markdown.js'
// import type { Grafaid } from '#lib/grafaid'
import type { GrafaidOld } from '#lib/grafaid-old/index'
import type { GraphQLNamedType } from 'graphql'

export const Description: React.FC<{ data: GraphQLNamedType | GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.description) return null

  return (
    <Text as='div' color='gray'>
      <Markdown>{data.description}</Markdown>
    </Text>
  )
}

import type { FC } from 'react'
import { Text } from '@radix-ui/themes'
import { Markdown } from './Markdown'
import type { Grafaid } from '../../../lib/grafaid'
import type { GraphQLNamedType } from 'graphql'

export const Description: FC<{ data: GraphQLNamedType | Grafaid.GraphQLField }> = ({ data }) => {
  if (!data.description) return null

  return (
    <Text as="div" color="gray">
      <Markdown>{data.description}</Markdown>
    </Text>
  )
}

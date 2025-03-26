import type { FC } from 'react'
import { Text } from '@radix-ui/themes'
import { Markdown } from './Markdown'
import type { Grafaid } from '../../../lib/grafaid'

export const DeprecationReason: FC<{ data: Grafaid.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as="div" color="red">
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

import type { FC } from 'react'
import { Text } from '@radix-ui/themes'
import { Markdown } from './Markdown.jsx'
import type { GrafaidOld } from '#lib/grafaid-old/index.js'

export const DeprecationReason: FC<{ data: GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as="div" color="red">
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

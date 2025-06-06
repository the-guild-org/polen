import type { GrafaidOld } from '#lib/grafaid-old/index.ts'
import { Text } from '@radix-ui/themes'
import type { FC } from 'react'
import { Markdown } from './Markdown.jsx'

export const DeprecationReason: FC<{ data: GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as='div' color='red'>
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

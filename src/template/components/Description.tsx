import { Text } from '@radix-ui/themes'
import type { FC } from 'react'
import { Markdown } from './Markdown.tsx'
// import type { Grafaid } from '#lib/grafaid'
import type { GrafaidOld } from '#lib/grafaid-old/index'
import type { GraphQLNamedType } from 'graphql'

export const Description: FC<{ data: GraphQLNamedType | GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.description) return null

  return (
    <Text as='div' color='gray'>
      <Markdown>{data.description}</Markdown>
    </Text>
  )
}

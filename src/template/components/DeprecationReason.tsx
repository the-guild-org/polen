import type { React } from '#dep/react/index'
import type { GrafaidOld } from '#lib/grafaid-old'
import { Text } from '@radix-ui/themes'
import { Markdown } from './Markdown.js'

export const DeprecationReason: React.FC<{ data: GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.deprecationReason) return null

  return (
    <Text as='div' color='red'>
      <Markdown>{data.deprecationReason}</Markdown>
    </Text>
  )
}

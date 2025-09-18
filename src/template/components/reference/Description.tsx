// TODO: Review and replace inline styles with Tailwind classes
import type { React } from '#dep/react/index'
import type { GraphQLNamedType } from 'graphql'
import type { GrafaidOld } from 'graphql-kit'
import { Markdown } from '../Markdown.js'
import { Text } from '../ui/index.js'

export const Description: React.FC<{ data: GraphQLNamedType | GrafaidOld.GraphQLField }> = ({ data }) => {
  if (!data.description) return null

  return (
    <Text as='div' size='2' color='gray' style={{ lineHeight: '1.5' }}>
      <Markdown>{data.description}</Markdown>
    </Text>
  )
}

import type { FC } from 'react'
import { type GraphQLNamedType } from 'graphql'
import { Box, Heading, Text } from '@radix-ui/themes'
import { Markdown } from './Markdown.jsx'
import { FieldListSection } from './FieldListSection.jsx'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const description = data.description
    ? (
      <Text as="div" color="gray">
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null
  return (
    <Box>
      <Heading size="8">{data.name}</Heading>
      {description}
      <FieldListSection data={data} />
    </Box>
  )
}

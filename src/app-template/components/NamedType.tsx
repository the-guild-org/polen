import type { FC } from 'react'
import { type GraphQLNamedType } from 'graphql'
import { Box, Heading, Text } from '@radix-ui/themes'
import ReactMarkdown from 'react-markdown'
import { FieldListSection } from './FieldListSection.jsx'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const description = data.description
    ? (
      <Text as="div" color="gray">
        <ReactMarkdown>{data.description}</ReactMarkdown>
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

'use client'

import { Box, Heading, Text } from '@radix-ui/themes'
import { type GraphQLNamedType } from 'graphql'
import type { FC } from 'react'
import { FieldListSection } from './FieldListSection.js'
import { Markdown } from './Markdown.js'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const description = data.description
    ? (
      <Text as='div' color='gray'>
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null
  return (
    <Box>
      <Heading size='8'>{data.name}</Heading>
      {description}
      <FieldListSection data={data} />
    </Box>
  )
}

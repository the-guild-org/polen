import { GrafaidOld } from '#lib/grafaid-old'
import { Box, Flex, Heading } from '@radix-ui/themes'
import { Obj } from '@wollybeard/kit'
import type { GraphQLNamedType, GraphQLSchema } from 'graphql'
import type { FC } from 'react'
import { ReferenceLink } from './ReferenceLink.js'

export interface Props {
  schema: GraphQLSchema
}

export const TypeIndex: FC<Props> = ({ schema }) => {
  const kindMap = GrafaidOld.getKindMap(schema)
  const sections = Obj.entries(kindMap.list)

  return (
    <Flex direction='column' gap='6'>
      {sections.map(([title, types]) => <TypeSection key={title} title={title} types={types} />)}
    </Flex>
  )
}

const TypeSection: FC<{ title: string; types: GraphQLNamedType[] }> = ({ title, types }) => {
  return (
    <Box>
      <Heading size='3'>{title}</Heading>
      <TypeList types={types} />
    </Box>
  )
}

const TypeList: FC<{ types: GraphQLNamedType[] }> = ({ types }) => {
  return (
    <Box>
      {types.map(type => (
        <Box key={type.name}>
          <ReferenceLink type={type.name}>
            {type.name}
          </ReferenceLink>
        </Box>
      ))}
    </Box>
  )
}

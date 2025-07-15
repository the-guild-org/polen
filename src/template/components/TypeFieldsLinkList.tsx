import { Box, Flex, Heading } from '@radix-ui/themes'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import type { FC } from 'react'
import { ReferenceLink } from './ReferenceLink.js'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
}

export const TypeFieldsLinkList: FC<Props> = ({ type }) => {
  return (
    <Box>
      <Heading>{type.name}</Heading>
      <Flex direction='column'>
        {Object.values(type.getFields()).map(field => {
          return (
            <Box key={field.name}>
              <ReferenceLink
                type={type.name}
                field={field.name}
                // TODO: can we use styled from Radix?
                // activeProps={{ style: { fontWeight: `bold` } }}
              >
                {field.name}
              </ReferenceLink>
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}

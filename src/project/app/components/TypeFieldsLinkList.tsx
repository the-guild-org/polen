import type { FC } from 'react'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { Box, Flex, Heading } from '@radix-ui/themes'
import { Link } from './Link'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
}

export const TypeFieldsLinkList: FC<Props> = ({ type }) => {
  return (
    <Box>
      <Heading>{type.name}</Heading>
      <Flex direction="column">
        {Object.values(type.getFields()).map(field => {
          return (
            <Box key={field.name}>
              <Link
                to="/reference/$type/$field"
                params={{ type: type.name, field: field.name }}
                // TODO: can we use styled from Radix?
                activeProps={{ style: { fontWeight: `bold` } }}
              >
                {field.name}
              </Link>
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}

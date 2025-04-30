import type { FC } from 'react'
import type { GraphQLArgument } from 'graphql'
import { Box, Flex, Text } from '@radix-ui/themes'
import { TypeAnnotation } from './TypeAnnotation.jsx'

export interface Props {
  data: GraphQLArgument
}

/**
 * Renders a single GraphQL argument in SDL syntax
 */
export const ArgumentAnnotation: FC<Props> = ({ data }) => {
  return (
    <Box as="div">
      <Flex>
        <Text>{data.name}</Text>
        <Text>:&nbsp;</Text>

        <TypeAnnotation type={data.type} />
      </Flex>
    </Box>
  )
}

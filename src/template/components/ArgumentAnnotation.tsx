import { Box, Flex, Text } from '@radix-ui/themes'
import type { GraphQLArgument } from 'graphql'
import type { FC } from 'react'
import { TypeAnnotation } from './TypeAnnotation.js'

export interface Props {
  data: GraphQLArgument
}

/**
 * Renders a single GraphQL argument in SDL syntax
 */
export const ArgumentAnnotation: FC<Props> = ({ data }) => {
  return (
    <Box as='div'>
      <Flex>
        <Text>{data.name}</Text>
        <Text>:&nbsp;</Text>

        <TypeAnnotation type={data.type} />
      </Flex>
    </Box>
  )
}

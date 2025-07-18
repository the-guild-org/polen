import type { React } from '#dep/react/index'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import type { GraphQLArgument } from 'graphql'
import { TypeAnnotation } from './TypeAnnotation.js'

export const ArgumentsList: React.FC<{ args: readonly GraphQLArgument[] }> = ({ args }) => {
  if (args.length === 0) return null

  return (
    <Flex direction='column'>
      <Heading size='1' weight='bold'>Arguments</Heading>
      {args.map(arg => (
        <Box key={arg.name}>
          <Text>{arg.name}</Text>
          <Text>:</Text>
          <TypeAnnotation type={arg.type} />
          {arg.description && <Text as='p' size='2' color='gray'>{arg.description}</Text>}
        </Box>
      ))}
    </Flex>
  )
}

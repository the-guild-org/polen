import type { FC } from 'react'
import type { GraphQLNamedType, GraphQLSchema } from 'graphql'
import { Box, Flex, Heading } from '@radix-ui/themes'
import { Grafaid } from '../../../lib/grafaid'
import { Link } from './Link'
import { entries } from '../../../lib/prelude/main'

export interface Props {
  schema: GraphQLSchema
}

export const ColumnView: FC<Props> = ({ schema }) => {
  const kindMap = Grafaid.getKindMap(schema)
  const sections = entries(kindMap.list)

  return (
    <Flex direction="column" gap="6">
      {sections.map(([title, types]) => <TypeSection key={title} title={title} types={types} />)}
    </Flex>
  )
}

const TypeSection: FC<{ title: string, types: GraphQLNamedType[] }> = ({ title, types }) => {
  return (
    <Box>
      <Heading size="3">{title}</Heading>
      <TypeList types={types} />
    </Box>
  )
}

const TypeList: FC<{ types: GraphQLNamedType[] }> = ({ types }) => {
  return (
    <Box>
      {types.map(type => (
        <Box key={type.name}>
          <Link to="/reference/$type" params={{ type: type.name }}>
            {type.name}
          </Link>
        </Box>
      ))}
    </Box>
  )
}

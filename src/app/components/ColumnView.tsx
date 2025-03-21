import type { FC } from 'react'
import type { GraphQLNamedType, GraphQLObjectType } from 'graphql'
import { useParams } from 'react-router-dom'
import { TypeList } from './TypeList'
import { TypeDetails } from './TypeDetails'
import { EntryPointFields } from './EntryPointFields'
import { Flex, Container, Box } from '@radix-ui/themes'
import { Grafaid } from '../utils/grafaid'

export interface Props {
  types: GraphQLNamedType[]
}

export const ColumnView: FC<Props> = ({ types }) => {
  const { name, viewName = `column` } = useParams<{ name: string, viewName: string }>()
  const type = name ? types.find(t => t.name === name) : undefined

  // Get entry point types (Query, Mutation, Subscription)
  const entryPointTypes = Grafaid.getEntryPointTypes(types)
  
  // Filter out entry points to get all other types
  const otherTypes = Grafaid.getNonEntryPointTypes(types, entryPointTypes)

  return (
    <Container size="4" px="5" py="4">
      <Flex gap="6">
        <Flex direction="column" gap="6" width="350px">
          {/* Render each entry point type as its own section with fields */}
          {entryPointTypes.map(entryPointType => (
            <EntryPointFields
              key={entryPointType.name}
              type={entryPointType as GraphQLObjectType}
              viewName={viewName}
            />
          ))}
          
          {/* Render all other types in an index */}
          <TypeList
            types={Array.from(otherTypes)}
            title="Index"
            viewName={viewName}
          />
        </Flex>
        <Box flexGrow="1">
          {type && <TypeDetails type={type} />}
        </Box>
      </Flex>
    </Container>
  )
}

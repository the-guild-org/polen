import type { FC } from 'react'
import type { GraphQLNamedType, GraphQLObjectType } from 'graphql'
import { Box, Flex } from '@radix-ui/themes'
import { Grafaid } from '../../../lib/grafaid'
import { TypeFieldsLinkList } from './TypeFieldsLinkList'

export interface Props {
  types: GraphQLNamedType[]
}

export const ColumnView: FC<Props> = ({ types }) => {
  const entryPointTypes = Grafaid.getEntryPointTypes(types)
  // const otherTypes = Grafaid.getNonEntryPointTypes(types, entryPointTypes)

  return (
    <Flex gap="6">
      <Flex direction="column" gap="6" width="350px">
        {/* Render each entry point type as its own section with fields */}
        {entryPointTypes.map(entryPointType => (
          // entryPointType.name
          <TypeFieldsLinkList
            key={entryPointType.name}
            type={entryPointType}
          />
        ))}

        {/* Render all other types in an index */}
        {
          /* <TypeList
            types={Array.from(otherTypes)}
            title="Index"
            // viewName={viewName}
          /> */
        }
      </Flex>
      <Box flexGrow="1">
        {/* {type && <TypeDetails type={type} />} */}
      </Box>
    </Flex>
  )
}

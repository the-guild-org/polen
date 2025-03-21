import React from 'react'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { OutputFields } from './OutputFields'
import { Box, Flex, Text } from '@radix-ui/themes'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
  isExpanded: boolean
  toggleType: (typeName: string) => void
  openTypes: ReadonlySet<string>
}

/**
 * This component renders the fields of a type as a list.
 * It is used inside the TypeSection component.
 * It is called "OutputFields" because it is used to render the fields of an object type,
 * which are the fields returned by the field resolvers of the type.
 */
export const RootPositionType: React.FC<Props> = ({
  type,
  isExpanded,
  toggleType,
  openTypes,
}) => {
  return (
    <Box
      key={type.name}
      mt="3"
      style={{
        fontFamily: `monospace`,
      }}
    >
      <Flex align="center" gap="2">
        <button
          onClick={() => {
            toggleType(type.name)
          }}
          style={{
            border: `none`,
            background: `none`,
            padding: `0 0.25rem`,
            cursor: `pointer`,
            fontFamily: `inherit`,
          }}
        >
          {isExpanded ? `▼` : `▶`}
        </button>
        <Text weight="bold" size="2">
          {type.name}
        </Text>
      </Flex>
      {type.description && (
        <Box ml="6" style={{ maxWidth: `60ch` }}>
          <Text size="1" color="gray" style={{ fontFamily: `system-ui` }}>
            {type.description}
          </Text>
        </Box>
      )}
      {isExpanded && (
        <OutputFields
          parentType={type}
          toggleType={toggleType}
          openTypes={openTypes}
        />
      )}
    </Box>
  )
}

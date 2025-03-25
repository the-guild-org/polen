import type { FC } from 'react'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import { Box, Flex, Heading } from '@radix-ui/themes'
import { Grafaid } from '../../../lib/grafaid'
import { Link } from '@tanstack/react-router'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
  // viewName?: string
}

export const TypeFieldsLinkList: FC<Props> = ({ type }) => {
  const fields = Grafaid.isTypeWithFields(type)
    ? type.getFields()
    : null

  if (!fields) return null

  return (
    <Box>
      <Heading>{type.name}</Heading>
      <Flex direction="column">
        {Object.entries(fields).map(([fieldName, field]) => {
          const fieldPath = `${type.name}.${fieldName}`
          // Check if current path is the field name or ends with /{fieldName}
          // const isActive = currentPath === fieldName || location.pathname.endsWith(`/${fieldName}`)

          return (
            <Box key={fieldPath}>
              <Link to={`/reference/${type.name}/${fieldName}`}>{fieldName}</Link>
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}

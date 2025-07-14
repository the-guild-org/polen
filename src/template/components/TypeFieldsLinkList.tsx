import { Box, Flex, Heading } from '@radix-ui/themes'
import type { GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import type { FC } from 'react'
import { useVersionPath } from '../hooks/useVersionPath.js'
import { Link } from './Link.js'

export interface Props {
  type: GraphQLObjectType | GraphQLInterfaceType
}

export const TypeFieldsLinkList: FC<Props> = ({ type }) => {
  const versionPath = useVersionPath()

  return (
    (
      <Box>
        <Heading>{type.name}</Heading>
        <Flex direction='column'>
          {Object.values(type.getFields()).map(field => {
            return (
              (
                <Box key={field.name}>
                  <Link
                    to={`/reference/${versionPath}${type.name}/${field.name}`}
                    // TODO: can we use styled from Radix?
                    // activeProps={{ style: { fontWeight: `bold` } }}
                  >
                    {field.name}
                  </Link>
                </Box>
              )
            )
          })}
        </Flex>
      </Box>
    )
  )
}

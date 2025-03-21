import type { FC } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { useParams } from 'react-router-dom'
import { TypeList } from './TypeList'
import { TypeDetails } from './TypeDetails'
import { Flex, Container, Box } from '@radix-ui/themes'

export interface Props {
  types: GraphQLNamedType[]
}

export const ColumnView: FC<Props> = ({ types }) => {
  const { name, viewName = `column` } = useParams<{ name: string, viewName: string }>()
  const type = name ? types.find(t => t.name === name) : undefined

  const entryPoints = types.filter(t =>
    [
      `Query`,
      `Mutation`,
      `Subscription`,
    ].includes(t.name)
  )

  const otherTypes = types.filter(t => !entryPoints.includes(t))

  return (
    <Container size="4" px="5" py="4">
      <Flex gap="6">
        <Flex direction="column" gap="6" width="250px">
          <TypeList
            types={entryPoints}
            title="Entry Points"
            viewName={viewName}
          />
          <TypeList
            types={otherTypes}
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

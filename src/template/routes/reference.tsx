import type { DocumentNode } from 'graphql'
import { parse } from 'graphql'
import { TypeIndex } from '../components/TypeIndex.jsx'
import { Container, Flex } from '@radix-ui/themes'
import { Outlet, useLoaderData } from 'react-router'
import schemaFileContent from 'virtual:polen/assets/graphql-schema'
import { createRoute } from '#lib/react-router-helpers.js'
import { reference$type } from './reference.$type.jsx'
import { getSchema } from '../utilities/getSchema.js'

const loader = () => {
  const documentNode = parse(schemaFileContent)
  return {
    documentNode,
  }
}

const Component = () => {
  const data = useLoaderData<typeof loader>() as { documentNode: DocumentNode }
  const schema = getSchema(data.documentNode)

  return (
    <Flex direction="row" align="start">
      <TypeIndex schema={schema} />
      <Container>
        <Outlet />
      </Container>
    </Flex>
  )
}

export const reference = createRoute({
  path: `/reference`,
  loader,
  Component,
  children: [
    reference$type,
  ],
})

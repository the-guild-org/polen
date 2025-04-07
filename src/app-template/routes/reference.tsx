import type { DocumentNode } from 'graphql'
import { buildASTSchema, parse } from 'graphql'
import { ColumnView } from '../components/ColumnView.jsx'
import { Box, Flex } from '@radix-ui/themes'
import { Outlet, useLoaderData } from 'react-router'
// import { reference$type$field } from './reference.$type.$field.jsx'
import schemaFileContent from 'virtual:polen/assets/graphql-schema'
import { createRoute } from '../../lib/react-router-helpers.js'
import { reference$type } from './reference.$type.jsx'

const loader = () => {
  const documentNode = parse(schemaFileContent)
  return {
    documentNode,
  }
}

const Component = () => {
  const data = useLoaderData<typeof loader>() as { documentNode: DocumentNode }
  const schema = buildASTSchema(data.documentNode)

  return (
    <Flex direction="row" align="start">
      <ColumnView schema={schema} />
      <Box width="40rem">
        <Outlet />
      </Box>
    </Flex>
  )
}

export const reference = createRoute({
  path: `/reference`,
  loader,
  Component,
  children: [
    reference$type,
    // reference$type$field,
  ],
})

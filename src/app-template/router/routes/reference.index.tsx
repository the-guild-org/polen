import { Outlet, createRoute } from '@tanstack/react-router'
import schemaFileContent from 'virtual:pollen/assets/graphql-schema'
import { buildASTSchema, parse } from 'graphql'
import { ColumnView } from '../../components/ColumnView.jsx'
import { root } from './__root.jsx'
import { Box, Flex } from '@radix-ui/themes'

const component = () => {
  const data = referenceIndex.useLoaderData()
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

export const referenceIndex = createRoute({
  getParentRoute: () => root,
  path: `/reference`,
  component,
  loader: () => {
    const documentNode = parse(schemaFileContent)
    return {
      documentNode,
    }
  },
})

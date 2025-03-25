import { Outlet, createRoute } from '@tanstack/react-router'
import schemaFileContent from '../../../public/schema.graphql?raw'
import { buildASTSchema, parse } from 'graphql'
import { getTypes } from '../../../../app-old/utils/schema'
import { ColumnView } from '../../components/ColumnView'
import { root } from './__root'
import { Flex } from '@radix-ui/themes'

export const reference = createRoute({
  getParentRoute: () => root,
  path: `reference`,
  loader: async () => {
    const documentNode = parse(schemaFileContent)
    return {
      documentNode,
    }
  },
})

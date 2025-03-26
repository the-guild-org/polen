import { createRoute } from '@tanstack/react-router'
import schemaFileContent from '../../../public/schema.graphql?raw'
import { parse } from 'graphql'
import { root } from './__root'

export const reference = createRoute({
  getParentRoute: () => root,
  path: `reference`,
  loader: () => {
    const documentNode = parse(schemaFileContent)
    return {
      documentNode,
    }
  },
})

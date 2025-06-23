import type { GraphQLSchema } from 'graphql'
import React from 'react'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { GraphQLDocument } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'
import type { GraphQLDocumentProps } from '../../../lib/graphql-document/components/GraphQLDocument.tsx'

/**
 * Wrapper component that provides schema from virtual module directly to GraphQLDocument
 * This bypasses the context issue with MDX components
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, 'schema'>> = (props) => {
  const schema = PROJECT_DATA.schema?.versions[0]?.after
  console.log('Template wrapper - schema:', schema ? 'EXISTS' : 'UNDEFINED')
  console.log('Template wrapper - props:', props)
  console.log('Template wrapper - PROJECT_DATA.schema:', PROJECT_DATA.schema)

  return <GraphQLDocument {...props} schema={schema} />
}

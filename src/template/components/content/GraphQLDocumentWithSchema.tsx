import React from 'react'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { GraphQLDocument } from '../../../lib/graphql-document/components/GraphQLDocument.js'
import type { GraphQLDocumentProps } from '../../../lib/graphql-document/components/GraphQLDocument.js'

/**
 * Wrapper component that provides schema from virtual module directly to GraphQLDocument
 * This bypasses the context issue with MDX components
 */
export const GraphQLDocumentWithSchema: React.FC<Omit<GraphQLDocumentProps, `schema`>> = (props) => {
  const schema = SCHEMA?.versions[0]?.after
  return <GraphQLDocument {...props} schema={schema} />
}

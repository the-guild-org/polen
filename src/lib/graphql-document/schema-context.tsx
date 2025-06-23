import type { GraphQLSchema } from 'graphql'
import React from 'react'

export const GraphQLSchemaContext = React.createContext<GraphQLSchema | null>(null)

export const useGraphQLSchema = () => {
  const schema = React.useContext(GraphQLSchemaContext)
  return schema
}

export const GraphQLSchemaProvider: React.FC<React.PropsWithChildren<{ schema: GraphQLSchema | null }>> = ({
  children,
  schema,
}) => {
  return (
    <GraphQLSchemaContext.Provider value={schema}>
      {children}
    </GraphQLSchemaContext.Provider>
  )
}

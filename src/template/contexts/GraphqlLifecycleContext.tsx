import type { React } from '#dep/react/index'
import { Lifecycles } from '#lib/lifecycles/$'
import { Schema } from '#lib/schema/$'
import { createContext, useContext } from 'react'

interface SchemaContextValue {
  schema: Schema.Schema
  lifecycles: Lifecycles.Lifecycles
}

const SchemaContext = createContext<SchemaContextValue | undefined>(undefined)

export const GraphqlLifecycleProvider: React.FC<{
  children: React.ReactNode
  lifecycle: Lifecycles.Lifecycles
  schema: Schema.Schema
}> = ({ children, lifecycle, schema }) => {
  return (
    <SchemaContext.Provider value={{ schema, lifecycles: lifecycle }}>
      {children}
    </SchemaContext.Provider>
  )
}

export const useGraphqlLifecycle = () => {
  const context = useContext(SchemaContext)
  if (!context) {
    throw new Error(`useGraphqlLifecycle must be used within a GraphqlLifecycleProvider`)
  }
  // Maintain backward compatibility
  return {
    lifecycle: context.lifecycles,
    currentVersion: Schema.getVersion(context.schema),
  }
}

export const useSchema = () => {
  const context = useContext(SchemaContext)
  if (!context) {
    throw new Error(`useSchema must be used within a GraphqlLifecycleProvider`)
  }
  return context
}

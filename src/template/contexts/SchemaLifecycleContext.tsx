import type { React } from '#dep/react/index'
import { SchemaLifecycle } from '#lib/schema-lifecycle'
import { createContext, useContext } from 'react'

interface SchemaLifecycleContextValue {
  lifecycle: SchemaLifecycle.SchemaLifecycle | null
  currentVersion: string
}

const SchemaLifecycleContext = createContext<SchemaLifecycleContextValue | undefined>(undefined)

export const SchemaLifecycleProvider: React.FC<{
  children: React.ReactNode
  lifecycle: SchemaLifecycle.SchemaLifecycle | null
  currentVersion: string
}> = ({ children, lifecycle, currentVersion }) => {
  return (
    <SchemaLifecycleContext.Provider value={{ lifecycle, currentVersion }}>
      {children}
    </SchemaLifecycleContext.Provider>
  )
}

export const useSchemaLifecycle = () => {
  const context = useContext(SchemaLifecycleContext)
  if (!context) {
    throw new Error(`useSchemaLifecycle must be used within a SchemaLifecycleProvider`)
  }
  return context
}

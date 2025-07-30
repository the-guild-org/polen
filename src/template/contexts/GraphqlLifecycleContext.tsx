import type { React } from '#dep/react/index'
import { Lifecycles } from '#lib/lifecycles/$'
import { createContext, useContext } from 'react'

interface GraphqlLifecycleContextValue {
  lifecycle: Lifecycles.Lifecycles | null
  currentVersion: string
}

const GraphqlLifecycleContext = createContext<GraphqlLifecycleContextValue | undefined>(undefined)

export const GraphqlLifecycleProvider: React.FC<{
  children: React.ReactNode
  lifecycle: Lifecycles.Lifecycles | null
  currentVersion: string
}> = ({ children, lifecycle, currentVersion }) => {
  return (
    <GraphqlLifecycleContext.Provider value={{ lifecycle, currentVersion }}>
      {children}
    </GraphqlLifecycleContext.Provider>
  )
}

export const useGraphqlLifecycle = () => {
  const context = useContext(GraphqlLifecycleContext)
  if (!context) {
    throw new Error(`useGraphqlLifecycle must be used within a GraphqlLifecycleProvider`)
  }
  return context
}

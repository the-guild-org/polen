import type { React } from '#dep/react/index'
import { createContext, useContext } from 'react'

export interface ReferenceConfig {
  descriptionsView: {
    defaultMode: 'compact' | 'expanded'
    showControl: boolean
  }
  nullabilityRendering: 'questionMark' | 'bangMark'
}

interface ReferenceConfigContextValue {
  config: ReferenceConfig
}

const ReferenceConfigContext = createContext<ReferenceConfigContextValue | undefined>(undefined)

interface ReferenceConfigProviderProps {
  children: React.ReactNode
  config: ReferenceConfig
}

export const ReferenceConfigProvider: React.FC<ReferenceConfigProviderProps> = ({ children, config }) => {
  return (
    <ReferenceConfigContext.Provider value={{ config }}>
      {children}
    </ReferenceConfigContext.Provider>
  )
}

export const useReferenceConfig = () => {
  const context = useContext(ReferenceConfigContext)
  if (!context) {
    throw new Error('useReferenceConfig must be used within ReferenceConfigProvider')
  }
  return context.config
}

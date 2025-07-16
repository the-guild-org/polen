import { createContext } from 'react'

interface SidebarContextValue {
  basePath?: string
}

export const SidebarContext = createContext<SidebarContextValue>({})

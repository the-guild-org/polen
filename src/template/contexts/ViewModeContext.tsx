import type { React } from '#dep/react/index'
import { createContext, useContext, useEffect, useState } from 'react'

export type ViewMode = 'compact' | 'expanded'

interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined)

const STORAGE_KEY = 'polen-view-mode'

interface ViewModeProviderProps {
  children: React.ReactNode
  defaultMode?: ViewMode
}

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children, defaultMode = 'expanded' }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode)

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'compact' || saved === 'expanded') {
      setViewModeState(saved)
    }
  }, [])

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  useEffect(() => {
    // Sync with localStorage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'compact' || e.newValue === 'expanded')) {
        setViewModeState(e.newValue as ViewMode)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export const useViewMode = () => {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error('useViewMode must be used within ViewModeProvider')
  }
  return context
}

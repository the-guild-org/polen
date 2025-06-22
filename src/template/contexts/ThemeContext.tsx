import type { React } from '#dep/react/index'
import { createContext, useContext, useEffect, useState } from 'react'

type ThemeAppearance = 'light' | 'dark'

interface ThemeContextValue {
  appearance: ThemeAppearance
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'polen-theme-preference'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<ThemeAppearance>(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return 'light'
    }
    
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  useEffect(() => {
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, appearance)
    }
  }, [appearance])

  const toggleTheme = () => {
    setAppearance(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ appearance, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
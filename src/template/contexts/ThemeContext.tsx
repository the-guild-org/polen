import type { React } from '#dep/react/index'
import { createContext, useContext, useEffect, useState } from 'react'
import * as Theme from '../../lib/theme/theme.ts'

type ThemeAppearance = 'light' | 'dark'

interface ThemeContextValue {
  appearance: ThemeAppearance
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Create theme manager instance
const themeManager = Theme.createThemeManager({
  cookieName: 'polen-theme-preference',
})

// Theme CSS component to ensure consistent CSS on server and client
const ThemeCSS: React.FC = () => {
  const css = themeManager.getCSS()
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<ThemeAppearance>(() => {
    // Try to read from cookie first (works on both server and client)
    const cookieTheme = themeManager.readCookie()
    if (cookieTheme) {
      return cookieTheme
    }

    // Fallback to system preference on client
    if (typeof window !== 'undefined') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }

    // Default fallback
    return 'light'
  })

  useEffect(() => {
    // Apply current theme to DOM on mount (for client-side navigation)
    themeManager.applyToDOM(appearance)
  }, [appearance])

  const toggleTheme = () => {
    const newTheme = themeManager.toggle()
    setAppearance(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ appearance, toggleTheme }}>
      <ThemeCSS />
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

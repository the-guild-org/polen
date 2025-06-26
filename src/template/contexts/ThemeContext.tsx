import type { React } from '#dep/react/index'
import { createContext, useContext, useEffect, useState } from 'react'
import * as Theme from '../../lib/theme/theme.ts'

type ThemeAppearance = `light` | `dark`
type ThemePreference = `light` | `dark` | `system`

interface ThemeContextValue {
  appearance: ThemeAppearance
  preference: ThemePreference
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Create theme manager instance
const themeManager = Theme.createThemeManager({
  cookieName: `polen-theme-preference`,
})

// Theme CSS component to ensure consistent CSS on server and client
const ThemeCSS: React.FC = () => {
  const css = themeManager.getCSS()
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<ThemeAppearance>(() => {
    // Initial appearance from server or browser
    const serverTheme = globalThis.__POLEN__.serverContext.theme
    if (serverTheme === 'system') {
      // During SSR, default to light for system preference
      // Client will detect actual preference on mount
      return typeof globalThis.window !== 'undefined'
        ? (globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : 'light'
    }
    return serverTheme
  })

  const [preference, setPreference] = useState<ThemePreference>(() => {
    // Initial preference from server-rendered theme
    const serverTheme = globalThis.__POLEN__.serverContext.theme
    // If server sent a specific theme (from cookie), use that as preference
    // Otherwise it's system preference
    return serverTheme
  })

  useEffect(() => {
    // Apply theme preference to DOM on mount and when it changes
    themeManager.applyToDOM(preference)

    // Update appearance based on preference
    if (preference === 'system') {
      const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setAppearance(systemTheme)

      // Listen for system theme changes
      const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        if (preference === 'system') {
          setAppearance(e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setAppearance(preference)
    }
  }, [preference])

  const toggleTheme = () => {
    const newPref = themeManager.toggle() as ThemePreference
    setPreference(newPref)
  }

  return (
    <ThemeContext.Provider value={{ appearance, preference, toggleTheme }}>
      <ThemeCSS />
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error(`useTheme must be used within a ThemeProvider`)
  }
  return context
}

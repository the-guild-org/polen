'use client'

import type { React } from '#dep/react/index'
import { themeManager } from '#template/singletons/theme-manager'
import { createContext, useContext, useEffect, useState } from 'react'
import * as Theme from '../../lib/theme/theme.js'

type ThemeAppearance = `light` | `dark`
type ThemePreference = Theme.Theme

interface ThemeContextValue {
  appearance: ThemeAppearance
  preference: ThemePreference
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: Theme.Theme }> = (
  { children, initialTheme },
) => {
  const defaultTheme: Theme.Theme = 'system'

  const [appearance, setAppearance] = useState<ThemeAppearance>(() => {
    const serverTheme = initialTheme ?? defaultTheme
    if (serverTheme === 'system') {
      // During SSR, default to light for system preference
      // Client will detect actual preference on mount
      return typeof globalThis.window !== 'undefined'
        ? (globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : 'light'
    }
    return serverTheme as ThemeAppearance
  })

  const [preference, setPreference] = useState<Theme.Theme>(() => {
    return initialTheme ?? defaultTheme
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

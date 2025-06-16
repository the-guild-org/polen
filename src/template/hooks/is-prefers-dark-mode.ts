import { useEffect, useState } from 'react'

// Hook to detect dark mode preference
export const useIsPrefersDarkMode = () => {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setPrefersDarkMode(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersDarkMode
}

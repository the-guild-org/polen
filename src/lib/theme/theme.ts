/**
 * Theme management utilities using CSS-first approach with cookie persistence.
 *
 * Strategy:
 * - CSS `prefers-color-scheme` handles initial theme (no JS needed)
 * - User toggle sets cookie + updates DOM immediately
 * - Server reads cookie on next visit for SSR hydration match
 */

export interface ThemeManager {
  /**
   * Read theme preference from cookie
   */
  readCookie(cookieString?: string): Theme | null

  /**
   * Write theme preference to cookie
   */
  writeCookie(theme: Theme): string

  /**
   * Apply theme to DOM (sets class on document element)
   */
  applyToDOM(theme: Theme): void

  /**
   * Get current theme from DOM
   */
  getCurrentFromDOM(): Theme | null

  /**
   * Toggle theme and persist to cookie
   * Returns the new theme
   */
  toggle(): Theme

  /**
   * Set specific theme and persist to cookie
   */
  set(theme: Theme): void

  /**
   * Get CSS string for SSR injection
   * Includes prefers-color-scheme fallback and cookie-based override
   */
  getCSS(): string
}

export type Theme = 'light' | 'dark'

export interface ThemeOptions {
  /**
   * Cookie name for theme persistence
   * @default 'theme'
   */
  cookieName?: string

  /**
   * CSS class prefix for theme classes
   * @default ''
   */
  classPrefix?: string

  /**
   * Cookie max age in seconds
   * @default 31536000 (1 year)
   */
  maxAge?: number

  /**
   * Cookie path
   * @default '/'
   */
  path?: string
}

/**
 * Create a theme manager instance
 */
export const createThemeManager = (options: ThemeOptions = {}): ThemeManager => {
  const {
    cookieName = 'theme',
    classPrefix = '',
    maxAge = 31536000, // 1 year
    path = '/',
  } = options

  const getThemeClass = (theme: Theme): string => classPrefix ? `${classPrefix}${theme}` : theme

  const readCookie = (cookieString?: string): Theme | null => {
    const cookies = cookieString || (typeof document !== 'undefined' ? document.cookie : '')
    if (!cookies) return null

    const match = cookies.match(new RegExp(`(^| )${cookieName}=([^;]+)`))
    const value = match?.[2]

    return value === 'light' || value === 'dark' ? value : null
  }

  const writeCookie = (theme: Theme): string => {
    const cookieValue = `${cookieName}=${theme}; Max-Age=${maxAge}; Path=${path}; SameSite=Strict`

    // Set cookie if in browser
    if (typeof document !== 'undefined') {
      document.cookie = cookieValue
    }

    return cookieValue
  }

  const applyToDOM = (theme: Theme): void => {
    if (typeof document === 'undefined') return

    const themeClass = getThemeClass(theme)
    const otherTheme = theme === 'light' ? 'dark' : 'light'
    const otherClass = getThemeClass(otherTheme)

    document.documentElement.classList.remove(otherClass)
    document.documentElement.classList.add(themeClass)
  }

  const getCurrentFromDOM = (): Theme | null => {
    if (typeof document === 'undefined') return null

    const classList = document.documentElement.classList

    if (classList.contains(getThemeClass('dark'))) return 'dark'
    if (classList.contains(getThemeClass('light'))) return 'light'

    return null
  }

  const set = (theme: Theme): void => {
    writeCookie(theme)
    applyToDOM(theme)
  }

  const toggle = (): Theme => {
    // Get current theme from DOM or cookie, fallback to system preference
    let currentTheme = getCurrentFromDOM() || readCookie()

    if (!currentTheme && typeof window !== 'undefined') {
      // Fallback to system preference
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
    set(newTheme)
    return newTheme
  }

  const getCSS = (): string => {
    const lightClass = getThemeClass('light')
    const darkClass = getThemeClass('dark')

    return `
/* Theme CSS - handles both system preference and user override */
:root {
  /* Default light theme variables */
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme variables for system preference */
    color-scheme: dark;
  }
}

/* User preference overrides (set via cookie/JS) */
html.${lightClass} {
  /* Force light theme */
  color-scheme: light;
}

html.${darkClass} {
  /* Force dark theme */  
  color-scheme: dark;
}
`.trim()
  }

  return {
    readCookie,
    writeCookie,
    applyToDOM,
    getCurrentFromDOM,
    toggle,
    set,
    getCSS,
  }
}

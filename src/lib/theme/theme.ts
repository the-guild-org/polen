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

export type Theme = `light` | `dark` | `system`

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
    cookieName = `theme`,
    classPrefix = ``,
    maxAge = 31536000, // 1 year
    path = `/`,
  } = options

  const getThemeClass = (theme: Theme): string => classPrefix ? `${classPrefix}${theme}` : theme

  const readCookie = (cookieString?: string): Theme | null => {
    const cookies = cookieString || (typeof document !== `undefined` ? document.cookie : ``)
    if (!cookies) return null

    const match = new RegExp(`(^| )${cookieName}=([^;]+)`).exec(cookies)
    const value = match?.[2]

    return value === `light` || value === `dark` || value === `system` ? value : null
  }

  const writeCookie = (theme: Theme): string => {
    // If system is selected, delete the cookie by setting Max-Age to 0
    const cookieValue = theme === `system`
      ? `${cookieName}=; Max-Age=0; Path=${path}; SameSite=Strict`
      : `${cookieName}=${theme}; Max-Age=${maxAge}; Path=${path}; SameSite=Strict`

    // Set cookie if in browser
    if (typeof document !== `undefined`) {
      document.cookie = cookieValue
    }

    return cookieValue
  }

  const applyToDOM = (theme: Theme): void => {
    if (typeof document === `undefined`) return

    // If system, detect the actual theme to apply
    const actualTheme = theme === `system`
      ? (globalThis.matchMedia(`(prefers-color-scheme: dark)`).matches ? `dark` : `light`)
      : theme

    const themeClass = getThemeClass(actualTheme)
    const otherTheme = actualTheme === `light` ? `dark` : `light`
    const otherClass = getThemeClass(otherTheme)

    document.documentElement.classList.remove(otherClass)
    document.documentElement.classList.add(themeClass)

    // Also update data-theme attribute for consistency with SSR
    document.documentElement.setAttribute('data-theme', actualTheme)
  }

  const getCurrentFromDOM = (): Theme | null => {
    if (typeof document === `undefined`) return null

    const classList = document.documentElement.classList

    if (classList.contains(getThemeClass(`dark`))) return `dark`
    if (classList.contains(getThemeClass(`light`))) return `light`

    return null
  }

  const set = (theme: Theme): void => {
    writeCookie(theme)
    applyToDOM(theme)
  }

  const toggle = (): Theme => {
    // Get current theme preference from cookie
    const cookieTheme = readCookie()

    // Determine next theme in cycle: system → light → dark → system
    let newTheme: Theme
    if (!cookieTheme || cookieTheme === `system`) {
      // Currently on system, go to light
      newTheme = `light`
    } else if (cookieTheme === `light`) {
      // Currently on light, go to dark
      newTheme = `dark`
    } else {
      // Currently on dark, go back to system
      newTheme = `system`
    }

    set(newTheme)
    return newTheme
  }

  const getCSS = (): string => {
    const lightClass = getThemeClass(`light`)
    const darkClass = getThemeClass(`dark`)

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

import { createHtmlTransformer } from '#lib/html-utils/html-transformer'
import { injectGlobalDataIntoHTML } from '#lib/html-utils/inject-global-data'
import * as Theme from '#lib/theme/theme'
import type { PolenGlobalData } from '../../constants.ts'

/**
 * HTML transformer that injects Polen global data based on request context
 * This runs in both dev and production modes to ensure consistent behavior
 */
export const createPolenDataInjector = () => {
  return createHtmlTransformer((html, ctx) => {
    // Create theme manager to read cookies
    const themeManager = Theme.createThemeManager({
      cookieName: `polen-theme-preference`,
    })

    // Get theme from request cookies
    const cookies = ctx.req.header(`cookie`) || ``
    const cookieTheme = themeManager.readCookie(cookies)

    // Use existing Polen global data if available, otherwise create new
    const polenData: PolenGlobalData = globalThis.__POLEN__ || {
      serverContext: {
        theme: cookieTheme || 'system', // No cookie means system preference
        isDev: !__BUILDING__, // true in dev, false in production
      },
    }

    // Just inject the Polen data, no additional code
    return injectGlobalDataIntoHTML(html, '__POLEN__', polenData)
  })
}

import { debugPolen } from '#singletons/debug'
import { themeManager } from '#template/singletons/theme-manager'
import { Outlet, type unstable_MiddlewareFunction } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import projectDataNavbar from 'virtual:polen/project/data/navbar.jsonsuper'
import { templateVariables } from 'virtual:polen/template/variables'
import { getTheme, requestAsyncContext } from './contexts-async/request.js'
import { LayoutClient } from './root.client.js'
import './styles/global.css'

console.log({ projectDataNavbar })

const debug = debugPolen.sub('app-root')

// Middleware to set up request context
export const unstable_middleware: unstable_MiddlewareFunction[] = [
  async ({ request }, next) => {
    const cookieHeader = request.headers.get('Cookie')

    const theme = themeManager.getTheme(cookieHeader)

    debug('middleware', { theme })

    return requestAsyncContext.run(
      { request, theme },
      async () => await next(),
    )
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = getTheme()
  const themeCSS = themeManager.getCSS()

  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>{templateVariables.title}</title>
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body>
        <LayoutClient
          navbarItems={projectDataNavbar}
          logoSrc={logoSrc}
          title={templateVariables.title}
          initialTheme={theme}
        >
          {children}
        </LayoutClient>
      </body>
    </html>
  )
}

export default function Root() {
  return <Outlet />
}

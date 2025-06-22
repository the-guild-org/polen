import type { ReactRouter } from '#dep/react-router/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Box, Grid } from '@radix-ui/themes'
import { Flex, Theme } from '@radix-ui/themes'
import radixStylesUrl from '@radix-ui/themes/styles.css?url'
import { Arr } from '@wollybeard/kit'
import { useEffect, useState } from 'react'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import projectDataNavbar from 'virtual:polen/project/data/navbar.jsonsuper'
import projectDataPages from 'virtual:polen/project/data/pages.jsonsuper'
import { pages } from 'virtual:polen/project/pages.jsx'
import { templateVariables } from 'virtual:polen/template/variables'
import { HamburgerMenu } from '../components/HamburgerMenu.tsx'
import { Link } from '../components/Link.tsx'
import { Logo } from '../components/Logo.tsx'
import { NotFound } from '../components/NotFound.tsx'
import { Sidebar } from '../components/sidebar/Sidebar.tsx'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.tsx'
import entryClientUrl from '../entry.client.jsx?url'
import { changelog } from './changelog.tsx'
import { index } from './index.tsx'
import { reference } from './reference.tsx'

// todo: not needed anymore because not using hono dev vite plugin right?
const reactRefreshPreamble = `
import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
`

export const Component = () => {
  return (
    <html lang='en'>
      <head>
        {import.meta.env.DEV && <script type='module'>{reactRefreshPreamble}</script>}
        {import.meta.env.DEV && <script type='module' src='/@vite/client'></script>}
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>{templateVariables.title}</title>
        {import.meta.env.DEV && <link rel='stylesheet' href={radixStylesUrl} />}
        {/* <link rel='icon' type='image/svg+xml' href={assetUrl('/favicon.svg', PROJECT_DATA.basePath)} /> */}
        {/* <link rel='manifest' href={assetUrl('/manifest.json', PROJECT_DATA.basePath)} /> */}
        {/* <meta name='theme-color' content='#000000' /> */}
      </head>
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          <Layout />
        </ThemeProvider>
        <ScrollRestoration />
        {import.meta.env.DEV && <script type='module' src={entryClientUrl}></script>}
      </body>
    </html>
  )
}

const Layout = () => {
  const location = useLocation()
  const { appearance } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Determine if we should show sidebar based on current path
  const getCurrentNavPathExp = (): string | null => {
    // todo: general path manipulation lib because we are duplicating logic here found in FileRouter
    // todo: kit: try a Str.split that returns [] | string[] so that our predicates can refine on it?
    const segments = location.pathname.split(`/`).filter(Boolean)
    if (Arr.isntEmpty(segments)) {
      return `/${segments[0]}`
    }
    return null
  }

  const currentNavPathExp = getCurrentNavPathExp()
  const sidebar = currentNavPathExp && projectDataPages.sidebarIndex[currentNavPathExp]
  const isShowSidebar = sidebar && sidebar.items.length > 0

  const header = (
    <Flex
      gridArea={'header'}
      align='center'
      gap={{ initial: '4', md: '8' }}
      pb='4'
      mb={{ initial: '4', md: '8' }}
      style={{
        borderBottom: `1px solid var(--gray-3)`,
      }}
    >
      {/* Mobile menu - only show when sidebar exists */}
      {isShowSidebar && (
        <HamburgerMenu
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onClose={() => setMobileMenuOpen(false)}
          sidebarData={sidebar.items}
        />
      )}

      <LinkReactRouter
        to='/'
        style={{ color: `inherit`, textDecoration: `none` }}
      >
        <Box display={{ initial: 'block', md: 'block' }}>
          <Logo src={logoSrc} title={templateVariables.title} height={30} showTitle={true} />
        </Box>
      </LinkReactRouter>
      <Flex direction='row' gap='4' style={{ flex: 1 }}>
        {projectDataNavbar.map((item, key) => (
          <Link key={key} color='gray' to={item.pathExp}>
            {item.title}
          </Link>
        ))}
      </Flex>
      <ThemeToggle />
    </Flex>
  )

  return (
    <Theme asChild appearance={appearance}>
      <Grid
        width={{ initial: '100%', sm: '100%', md: 'var(--container-4)' }}
        maxWidth='100vw'
        areas={{
          initial: "'header' 'content'",
          sm: "'header' 'content'",
          md:
            "'header header header header header header header header' 'sidebar sidebar . content content content content content'",
        }}
        rows='min-content auto'
        columns={{ initial: '1fr', sm: '1fr', md: 'repeat(8, 1fr)' }}
        gapX={{ initial: '0', sm: '0', md: '2' }}
        my={{ initial: '0', sm: '0', md: '8' }}
        mx='auto'
        px={{ initial: '4', sm: '4', md: '0' }}
        py={{ initial: '4', sm: '4', md: '0' }}
      >
        <style>
          {`
          /* Responsive container fixes */
          @media (max-width: 768px) {
            body {
              overflow-x: hidden;
            }
          }
          
          /* Ensure proper centering on all screen sizes */
          .rt-Grid {
            box-sizing: border-box;
          }

          /* Shiki code blocks */
          pre.shiki {
            margin: 1rem 0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.6;
            background-color: #f6f8fa;
          }

          /* Light mode: use --shiki-light CSS variables from inline styles */
          pre.shiki span {
            color: var(--shiki-light);
          }

          /* Dark mode - Radix Themes uses [data-is-root-theme="dark"] */
          [data-is-root-theme="dark"] pre.shiki {
            background-color: #1a1b26;
          }

          [data-is-root-theme="dark"] pre.shiki span {
            color: var(--shiki-dark);
          }

          pre.shiki code {
            font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
            background: transparent;
            display: block;
          }
        `}
        </style>
        {header}

        {/* Desktop Sidebar */}
        {isShowSidebar && (
          <Box
            display={{ initial: 'none', xs: 'none', sm: 'none', md: 'block' }}
            gridColumn='1 / 3'
            gridRow='2 / auto'
          >
            <Sidebar data={sidebar.items} />
          </Box>
        )}

        <Box gridArea='content / content / auto / 8'>
          <Outlet />
        </Box>
      </Grid>
    </Theme>
  )
}

const children: ReactRouter.RouteObject[] = [
  index,
  ...pages,
]

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Project Routes
//
//
//

if (PROJECT_DATA.schema) {
  children.push(changelog)
  children.push(reference)
}

//
//
//
//
// ━━━━━━━━━━━━━━ • Not Found Route
//
//
//

const notFoundRoute = createRoute({
  id: `*_not_found`,
  path: `*`,
  Component: NotFound,
  handle: {
    statusCode: 404,
  },
})
children.push(notFoundRoute)

//
//
//
// ━━━━━━━━━━━━━━ • Root Route
//
//

export const root = createRoute({
  path: `/`,
  Component,
  children,
})

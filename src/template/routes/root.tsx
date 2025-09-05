import type { NavbarProps } from '#api/hooks/types'
import type { ReactRouter } from '#dep/react-router/index'
import { route } from '#lib/react-router-effect/route'
import { Swiss } from '#lib/swiss'
import type { Stores } from '#template/stores/$'
import { Box, Theme } from '@radix-ui/themes'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import { templateConfig } from 'virtual:polen/project/config'
import * as projectHooks from 'virtual:polen/project/hooks'
import { navbar } from 'virtual:polen/project/navbar'
import { Logo } from '../components/Logo.js'
import { DefaultNavbar } from '../components/navbar/DefaultNavbar.js'
import { Item } from '../components/navbar/Item.js'
import { NotFound } from '../components/NotFound.js'
import { ThemeToggle } from '../components/ThemeToggle.js'
import { ToastContainer } from '../components/ToastContainer.js'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.js'
import { swissSharpTheme } from '../theme/swiss-sharp.js'
import '../theme/swiss-sharp.css'
import '../../lib/swiss/styles.css'
import { changelog } from './changelog.js'
import { examplesRoute } from './examples/_.js'
import { index } from './index.js'
import { pages } from './pages.js'
import { reference } from './reference.js'

export const Component = () => {
  return (
    <>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
      <ScrollRestoration />
    </>
  )
}

const Layout = () => {
  const { appearance } = useTheme()
  const location = useLocation()

  // Check if we're on home page with cinematic hero
  const isHomeWithCinematicHero = location.pathname === '/'
    && templateConfig.home.enabled
    && templateConfig.home.hero.enabled
    && templateConfig.home.hero.layout === 'cinematic'

  const navbarProps: NavbarProps = {
    items: navbar,
    Item,
    Logo: () => (
      <LinkReactRouter
        to='/'
        style={{ color: `inherit`, textDecoration: `none` }}
      >
        <Box display={{ initial: `block`, md: `block` }}>
          <Logo
            src={logoSrc}
            title={templateConfig.templateVariables.title}
            height={30}
            showTitle={true}
          />
        </Box>
      </LinkReactRouter>
    ),
    ThemeToggle,
  }

  const NavbarComponent = projectHooks.navbar || DefaultNavbar

  return (
    <Theme
      asChild
      appearance={appearance}
      {...swissSharpTheme}
    >
      <Swiss.Grid
        maxWidth='1440px'
        gutter='var(--space-4)'
        margins='var(--space-5)'
      >
        {/* Navbar */}
        {isHomeWithCinematicHero
          ? (
            // Cinematic hero mode: navbar is fixed overlay
            <Theme asChild appearance='dark'>
              <Swiss.Grid
                position='fixed'
                top={'0'}
                left={'0'}
                right={'0'}
                py={'6'}
                style={{
                  zIndex: 100,
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                <Swiss.Body subgrid>
                  <NavbarComponent {...navbarProps} />
                </Swiss.Body>
              </Swiss.Grid>
            </Theme>
          )
          : (
            // Normal mode: navbar in grid flow
            <Swiss.Body
              subgrid
              py={'6'}
              mb={{ initial: '4', md: '8' }}
              style={{
                borderBottom: '1px solid var(--gray-3)',
              }}
            >
              <NavbarComponent {...navbarProps} />
            </Swiss.Body>
          )}
        <Outlet />
        <ToastContainer />
      </Swiss.Grid>
    </Theme>
  )
}

const children: ReactRouter.RouteObject[] = []

// Conditionally add index route based on home.enabled
// When home is disabled, reference page becomes the root
if (templateConfig.home.enabled !== false) {
  children.push(index)
} else if (reference && templateConfig.schema?.enabled) {
  // When home is disabled and reference exists, make reference the index
  // We'll handle this by adding a redirect from index route
  children.push(index)
}

children.push(pages)

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Examples Routes
//
//
//

// Use the enabled flag from config
if (templateConfig.examples.enabled) {
  children.push(examplesRoute)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Project Routes
//
//
//

if (templateConfig.schema?.enabled) {
  if (changelog) {
    children.push(changelog)
  }
  if (reference) {
    children.push(reference)
  }
}

//
//
//
//
// ━━━━━━━━━━━━━━ • Not Found Route
//
//
//

const notFoundRoute = {
  id: `*_not_found`,
  path: `*`,
  Component: NotFound,
  handle: {
    statusCode: 404,
  },
}
children.push(notFoundRoute)

//
//
//
// ━━━━━━━━━━━━━━ • Root Route
//
//

const storeModules = import.meta.glob('../stores/!($.*)*.ts', { eager: true }) as Record<
  string,
  Stores.StoreModule
>

export const root = route({
  path: `/`,
  Component,
  loader: async () => {
    // Reset all stores on SSR to prevent cross-request pollution
    if (import.meta.env.SSR) {
      for (const module of Object.values(storeModules)) {
        if (module.store?.reset) {
          module.store.reset()
        }
      }
    }

    return {}
  },
  children,
})

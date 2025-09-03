import type { NavbarProps } from '#api/hooks/types'
import type { ReactRouter } from '#dep/react-router/index'
import { zd } from '#lib/kit-temp/other'
import { route } from '#lib/react-router-effect/route'
import type { Stores } from '#template/stores/$'
import { Box, Flex, Theme } from '@radix-ui/themes'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration } from 'react-router'
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

  const header = (
    <Flex
      align='center'
      gap={{ initial: `4`, md: `8` }}
      pb='4'
      mb={{ initial: `4`, md: `8` }}
      style={{
        borderBottom: `1px solid var(--gray-3)`,
      }}
    >
      <NavbarComponent {...navbarProps} />
    </Flex>
  )

  return (
    <Theme asChild appearance={appearance} radius='none'>
      <Box
        width={{ initial: `100%`, sm: `100%`, md: `var(--container-4)` }}
        maxWidth='100vw'
        my={{ initial: `0`, sm: `0`, md: `8` }}
        mx='auto'
        px={{ initial: `4`, sm: `4`, md: `0` }}
        py={{ initial: `4`, sm: `4`, md: `0` }}
      >
        {header}
        <Outlet />
        <ToastContainer />
      </Box>
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
  children.push(changelog)
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

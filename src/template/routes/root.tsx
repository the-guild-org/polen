import type { NavbarProps } from '#api/hooks/types'
import type { ReactRouter } from '#dep/react-router/index'
import { route } from '#lib/react-router-aid/react-router-aid'
import { createLoader } from '#lib/react-router-loader/react-router-loader'
import type { Stores } from '#template/stores/$'
import { Box, Flex, Theme } from '@radix-ui/themes'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import PROJECT_DATA from 'virtual:polen/project/data.json'
import * as projectHooks from 'virtual:polen/project/hooks'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'
import { templateVariables } from 'virtual:polen/template/variables'
import { Link as PolenLink } from '../components/Link.js'
import { Logo } from '../components/Logo.js'
import { DefaultNavbar } from '../components/navbar/DefaultNavbar.js'
import { Item } from '../components/navbar/Item.js'
import { NotFound } from '../components/NotFound.js'
import { ThemeToggle } from '../components/ThemeToggle.js'
import { ToastContainer } from '../components/ToastContainer.js'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.js'
import { changelog } from './changelog.js'
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
    items: PROJECT_DATA.navbar,
    Item,
    Logo: () => (
      <LinkReactRouter
        to='/'
        style={{ color: `inherit`, textDecoration: `none` }}
      >
        <Box display={{ initial: `block`, md: `block` }}>
          <Logo
            src={logoSrc}
            title={templateVariables.title}
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

const children: ReactRouter.RouteObject[] = [index, pages]

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Project Routes
//
//
//

if (PROJECT_SCHEMA) {
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

const notFoundRoute = route({
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

const storeModules = import.meta.glob('../stores/!($.*)*.ts', { eager: true }) as Record<
  string,
  Stores.StoreModule
>

export const root = route({
  path: `/`,
  Component,
  loader: createLoader(async () => {
    // Reset all stores on SSR to prevent cross-request pollution
    if (import.meta.env.SSR) {
      for (const module of Object.values(storeModules)) {
        if (module.store?.reset) {
          module.store.reset()
        }
      }
    }

    return {}
  }),
  children,
})

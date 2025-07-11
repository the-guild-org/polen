import type { ReactRouter } from '#dep/react-router/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Box } from '@radix-ui/themes'
import { Flex, Theme } from '@radix-ui/themes'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { routes } from 'virtual:polen/project/routes.jsx'
import { templateVariables } from 'virtual:polen/template/variables'
import { GraphQLSchemaProvider } from '../../lib/graphql-document/schema-context.js'
import { Link } from '../components/Link.js'
import { Logo } from '../components/Logo.js'
import { NotFound } from '../components/NotFound.js'
import { ThemeToggle } from '../components/ThemeToggle.js'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.js'
import { changelog } from './changelog.js'
import { index } from './index.js'
import { reference } from './reference.js'

export const Component = () => {
  const schema = PROJECT_DATA.schema?.versions[0]?.after || null

  // Make schema available globally for MDX components
  if (typeof window !== `undefined` && schema) {
    ;(window as any).__POLEN_GRAPHQL_SCHEMA__ = schema
  }

  return (
    <>
      <ThemeProvider>
        <GraphQLSchemaProvider schema={schema}>
          <Layout />
        </GraphQLSchemaProvider>
      </ThemeProvider>
      <ScrollRestoration />
    </>
  )
}

const Layout = () => {
  const { appearance } = useTheme()

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
      <LinkReactRouter
        to='/'
        style={{ color: `inherit`, textDecoration: `none` }}
      >
        <Box display={{ initial: `block`, md: `block` }}>
          <Logo src={logoSrc} title={templateVariables.title} height={30} showTitle={true} />
        </Box>
      </LinkReactRouter>
      <Flex direction='row' gap='4' style={{ flex: 1 }}>
        {PROJECT_DATA.navbar.map((item, key) => (
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
      </Box>
    </Theme>
  )
}

const children: ReactRouter.RouteObject[] = [
  index,
  ...routes,
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

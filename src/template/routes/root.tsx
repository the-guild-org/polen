import type { ReactRouter } from '#dep/react-router/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { SidebarLayout } from '#template/layouts/index'
import { MDXProvider } from '@mdx-js/react'
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Code,
  DataList,
  Em,
  Flex,
  Heading,
  Link,
  Quote,
  Separator,
  Strong,
  Table,
  Tabs,
  Text,
  Theme,
  Tooltip,
} from '@radix-ui/themes'
import { Link as LinkReactRouter, useLocation } from 'react-router'
import { Outlet, ScrollRestoration } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import PROJECT_DATA_PAGES_CATALOG from 'virtual:polen/project/data/pages-catalog.jsonsuper'
import { routes } from 'virtual:polen/project/routes.jsx'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.jsonsuper'
import { templateVariables } from 'virtual:polen/template/variables'
import { CodeBlock } from '../components/CodeBlock.js'
import { Link as PolenLink } from '../components/Link.js'
import { Logo } from '../components/Logo.js'
import { NotFound } from '../components/NotFound.js'
import { ThemeToggle } from '../components/ThemeToggle.js'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.js'
import { changelog } from './changelog.js'
import { index } from './index.js'
import { reference } from './reference.js'

export const Component = () => {
  const schema = PROJECT_SCHEMA?.versions[0]?.after || null

  // Make schema available globally for MDX components
  if (typeof window !== `undefined` && schema) {
    ;(window as any).__POLEN_GRAPHQL_SCHEMA__ = schema
  }

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
          <PolenLink key={key} color='gray' to={item.pathExp}>
            {item.title}
          </PolenLink>
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
        <MDXProvider
          components={{
            // Map markdown elements to Radix with spacing
            p: (props) => <Text as='p' mb='4' {...props} />,
            h1: (props) => <Heading size='8' mt='6' mb='4' {...props} />,
            h2: (props) => <Heading size='7' mt='6' mb='3' {...props} />,
            h3: (props) => <Heading size='6' mt='5' mb='3' {...props} />,
            h4: (props) => <Heading size='5' mt='5' mb='2' {...props} />,
            h5: (props) => <Heading size='4' mt='4' mb='2' {...props} />,
            h6: (props) => <Heading size='3' mt='4' mb='2' {...props} />,
            strong: Strong,
            em: Em,
            code: Code,
            blockquote: (props) => <Quote my='4' {...props} />,
            a: Link,
            hr: (props) => <Separator my='6' {...props} />,
            table: Table.Root,
            thead: Table.Header,
            tbody: Table.Body,
            tr: Table.Row,
            th: Table.ColumnHeaderCell,
            td: Table.Cell,
            // Lists need spacing too
            ul: (props) => <Box as='ul' mb='4' style={{ paddingLeft: '1.5rem' }} {...props} />,
            ol: (props) => <Box as='ol' mb='4' style={{ paddingLeft: '1.5rem' }} {...props} />,
            li: (props) => <Box as='li' mb='2' {...props} />,

            // Direct Radix components for MDX
            Badge,
            Button,
            // @ts-expect-error
            Callout,
            Card,
            // @ts-expect-error
            DataList,
            // @ts-expect-error
            Tabs,
            Tooltip,

            // Code Hike component
            CodeBlock,
          }}
        >
          <Outlet />
        </MDXProvider>
      </Box>
    </Theme>
  )
}

const PagesLayout = () => {
  const location = useLocation() // Add this line

  // Build sidebar from pages catalog
  // Get the top-level path segment (e.g., '/guide/foo' -> '/guide')
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const topLevelPath = pathSegments[0] ? `/${pathSegments[0]}` : '/'

  // Get the sidebar for this section
  const sidebar = PROJECT_DATA_PAGES_CATALOG.sidebarIndex[topLevelPath]?.items || []

  return (
    <SidebarLayout sidebar={sidebar}>
      <Outlet />
    </SidebarLayout>
  )
}

const children: ReactRouter.RouteObject[] = [
  index,
  {
    // Pathless layout route - doesn't affect URL paths
    Component: PagesLayout,
    children: [...routes], // All MDX page routes go here
  },
]

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

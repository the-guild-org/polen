import type { Content } from '#api/content/$'
import type { ReactRouter } from '#dep/react-router/index'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Box, Grid } from '@radix-ui/themes'
import { Flex, Theme } from '@radix-ui/themes'
import { Arr } from '@wollybeard/kit'
import { useEffect, useState } from 'react'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import logoSrc from 'virtual:polen/project/assets/logo.svg'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import projectDataNavbar from 'virtual:polen/project/data/navbar.json'
import projectPagesCatalog from 'virtual:polen/project/data/pages-catalog.jsonsuper'
import { routes } from 'virtual:polen/project/routes.jsx'
import { templateVariables } from 'virtual:polen/template/variables'
import { GraphQLSchemaProvider } from '../../lib/graphql-document/schema-context.tsx'
import { CodeBlockEnhancer } from '../components/CodeBlockEnhancer.tsx'
import { HamburgerMenu } from '../components/HamburgerMenu.tsx'
import { Link } from '../components/Link.tsx'
import { Logo } from '../components/Logo.tsx'
import { NotFound } from '../components/NotFound.tsx'
import { Sidebar } from '../components/sidebar/Sidebar.tsx'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext.tsx'
import { changelog } from './changelog.tsx'
import { index } from './index.tsx'
import { reference } from './reference.tsx'

export const Component = () => {
  const schema = PROJECT_DATA.schema?.versions[0]?.after || null

  // Make schema available globally for MDX components
  if (typeof window !== 'undefined' && schema) {
    ;(window as any).__POLEN_GRAPHQL_SCHEMA__ = schema
  }

  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>{templateVariables.title}</title>
      </head>
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          <GraphQLSchemaProvider schema={schema}>
            <Layout />
            <CodeBlockEnhancer />
          </GraphQLSchemaProvider>
        </ThemeProvider>
        <ScrollRestoration />
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
  const isReferencePage = currentNavPathExp === '/reference'

  const sidebar = (() => {
    if (isReferencePage && PROJECT_DATA.schema) {
      // Build reference sidebar from schema types
      const schema = PROJECT_DATA.schema.versions[0].after
      const kindMap = GrafaidOld.getKindMap(schema)

      const sidebarItems: Content.Item[] = []
      const kindEntries = Object.entries(kindMap.list).filter(([_, types]) => types.length > 0)

      for (const [title, types] of kindEntries) {
        sidebarItems.push({
          type: 'ItemSection' as const,
          title,
          pathExp: `reference-${title.toLowerCase()}`,
          isLinkToo: false,
          links: types.map(type => ({
            type: 'ItemLink' as const,
            title: type.name,
            pathExp: `reference/${type.name}`,
          })),
        })
      }

      return { items: sidebarItems }
    } else {
      // Use regular page sidebar
      return currentNavPathExp ? projectPagesCatalog.sidebarIndex[currentNavPathExp] || null : null
    }
  })()

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

        <Box gridArea='content / content / auto / 8' className='prose'>
          <Outlet />
        </Box>
      </Grid>
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

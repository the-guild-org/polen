import type { ReactRouter } from '#dep/react-router/index'
import { assetUrl, faviconUrl } from '#lib/asset-url/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Box, Button, Grid, Heading, Text } from '@radix-ui/themes'
import { Flex, Theme } from '@radix-ui/themes'
import radixStylesUrl from '@radix-ui/themes/styles.css?url'
import { Arr } from '@wollybeard/kit'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import projectDataNavbar from 'virtual:polen/project/data/navbar.jsonsuper'
import projectDataPages from 'virtual:polen/project/data/pages.jsonsuper'
import { pages } from 'virtual:polen/project/pages.jsx'
import { templateVariables } from 'virtual:polen/template/variables'
import { Link } from '../components/Link.jsx'
import { Sidebar } from '../components/sidebar/Sidebar.tsx'
import entryClientUrl from '../entry.client.jsx?url'
import { changelog } from './changelog.jsx'
import { index } from './index.jsx'
import { reference } from './reference.jsx'

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
        <link
          rel='icon'
          href={faviconUrl(PROJECT_DATA.faviconPath.replace(`.svg`, `.ico`) + `?v=1`, PROJECT_DATA.basePath)}
          sizes='256 x 256'
        />
        <link
          rel='icon'
          href={faviconUrl(PROJECT_DATA.faviconPath + `?v=1`, PROJECT_DATA.basePath)}
          sizes='any'
          type='image/svg+xml'
        />
      </head>
      <body style={{ margin: 0 }}>
        <Layout />
        <ScrollRestoration />
        {import.meta.env.DEV && <script type='module' src={entryClientUrl}></script>}
      </body>
    </html>
  )
}

const Layout = () => {
  const location = useLocation()

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
      gap='8'
      pb='4'
      mb='8'
      style={{
        borderBottom: `1px solid var(--gray-3)`,
      }}
    >
      <LinkReactRouter
        to='/'
        style={{ color: `inherit`, textDecoration: `none` }}
      >
        <Flex align='center' gap='2'>
          <GitHubLogoIcon style={{ width: 30, height: 30 }} />
          <Text size='3' weight='medium'>
            {templateVariables.title}
          </Text>
        </Flex>
      </LinkReactRouter>
      <Flex direction='row' gap='4'>
        {projectDataNavbar.map((item, key) => (
          <Link key={key} color='gray' to={item.pathExp}>
            {item.title}
          </Link>
        ))}
      </Flex>
    </Flex>
  )

  return (
    <Theme asChild>
      <Grid
        width={{ initial: 'var(--container-4)' }}
        areas="'header header header header header header header header' 'sidebar sidebar . content content content content content'"
        rows='min-content auto'
        columns='repeat(8, 1fr)'
        gapX='2'
        my='8'
        mx='auto'
      >
        <style>
          {`
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
        {isShowSidebar && (
          <Sidebar
            gridColumn='1 / 3'
            gridRow='2 / auto'
            data={sidebar.items}
            // ml='-100px'
            // style={{ transform: 'translate(calc(-100% - var(--space-8)))' }}
          />
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

const NotFoundComponent = () => {
  return (
    <Flex direction='column' align='center' gap='6' style={{ textAlign: `center`, paddingTop: `4rem` }}>
      <Heading size='9' style={{ color: `var(--gray-12)` }}>404</Heading>
      <Box>
        <Heading size='5' mb='2'>Page Not Found</Heading>
        <Text size='3' color='gray'>
          The page you're looking for doesn't exist or has been moved.
        </Text>
      </Box>
      <Flex gap='3'>
        <LinkReactRouter to='/'>
          <Button variant='soft' size='3'>
            Go Home
          </Button>
        </LinkReactRouter>
        <LinkReactRouter to='/reference'>
          <Button variant='outline' size='3'>
            View API Reference
          </Button>
        </LinkReactRouter>
      </Flex>
    </Flex>
  )
}

const notFoundRoute = createRoute({
  id: `*_not_found`,
  path: `*`,
  Component: NotFoundComponent,
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

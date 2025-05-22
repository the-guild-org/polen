import type { ReactRouter } from '#dep/react-router/index.js'
import { createRoute } from '#lib/react-router-helpers.js'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Box, Text } from '@radix-ui/themes'
import { Flex, Theme } from '@radix-ui/themes'
import radixStylesUrl from '@radix-ui/themes/styles.css?url'
import { Link as LinkReactRouter } from 'react-router'
import { Outlet, ScrollRestoration } from 'react-router'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { pages } from 'virtual:polen/project/pages.jsx'
import { templateVariables } from 'virtual:polen/template/variables'
import { Link } from '../components/Link.jsx'
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
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
        />
        <title>{templateVariables.title}</title>
        {import.meta.env.DEV && <link rel='stylesheet' href={radixStylesUrl} />}
        <link rel="icon" href={PROJECT_DATA.faviconPath.replace(`.svg`, `.ico`) + `?v=1`} sizes='256 x 256' />
        <link rel="icon" href={PROJECT_DATA.faviconPath + `?v=1`} sizes='any' type='image/svg+xml' />
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
  return (
    <Theme asChild>
      <Box m='8'>
        <Flex
          align='center'
          gap='8'
          pb='4'
          mb='8'
          style={{
            borderBottom: `1px solid var(--gray-3)`,
          }}
        >
          <LinkReactRouter to='/' style={{ color: `inherit`, textDecoration: `none` }}>
            <Flex align='center' gap='2'>
              <GitHubLogoIcon style={{ width: 30, height: 30 }} />
              <Text size='3' weight='medium'>{templateVariables.title}</Text>
            </Flex>
          </LinkReactRouter>
          <Flex direction='row' gap='4'>
            {PROJECT_DATA.siteNavigationItems.map((item, key) => (
              <Link key={key} color='gray' to={item.path}>{item.title}</Link>
            ))}
          </Flex>
        </Flex>
        <Box>
          <Outlet />
        </Box>
      </Box>
    </Theme>
  )
}

const children: ReactRouter.RouteObject[] = [
  index,
  ...pages,
]

if (PROJECT_DATA.schema) {
  children.push(changelog)
  children.push(reference)
}

export const root = createRoute({
  path: `/`,
  Component,
  children,
})

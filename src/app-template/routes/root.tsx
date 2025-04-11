import { Box, Text } from '@radix-ui/themes'
import { index } from './index.jsx'
import { Link as LinkReactRouter } from 'react-router'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Link } from '../components/Link.jsx'
import { Outlet, ScrollRestoration } from 'react-router'
import { Flex, Theme } from '@radix-ui/themes'
import { createRoute } from '../../lib/react-router-helpers.js'
import { reference } from './reference.jsx'
import radixStylesUrl from '@radix-ui/themes/styles.css?url'
import entryClientUrl from '../entry.client.jsx?url'
import { templateVariables } from 'virtual:polen/template/variables'

export const Component = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>{templateVariables.title}</title>
        {import.meta.env.DEV && <link rel="stylesheet" href={radixStylesUrl} />}
      </head>
      <body style={{ margin: 0 }}>
        <Layout />
        <ScrollRestoration />
        {import.meta.env.DEV && <script type="module" src={entryClientUrl}></script>}
      </body>
    </html>
  )
}

const Layout = () => {
  return (
    <Theme asChild>
      <Box m="8">
        <Flex
          align="center"
          gap="8"
          pb="4"
          mb="8"
          style={{
            borderBottom: `1px solid var(--gray-3)`,
          }}
        >
          <LinkReactRouter to="/" style={{ color: `inherit`, textDecoration: `none` }}>
            <Flex align="center" gap="2">
              <GitHubLogoIcon style={{ width: 30, height: 30 }} />
              <Text size="3" weight="medium">{templateVariables.title}</Text>
            </Flex>
          </LinkReactRouter>
          <Flex direction="row" gap="4">
            <Link color="gray" to="/reference">Reference</Link>
          </Flex>
        </Flex>
        <Box>
          <Outlet />
        </Box>
      </Box>
    </Theme>
  )
}

export const root = createRoute({
  path: `/`,
  Component,
  children: [
    index,
    reference,
  ],
})

import { Outlet, ScrollRestoration } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { createRoute } from '../../lib/react-router-helpers.js'
import { index } from './index.jsx'
import { reference } from './reference.jsx'
import radixStylesUrl from '@radix-ui/themes/styles.css?url'
import entryClientUrl from '../entry.client.jsx?url'

export const Component = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>My Developer Portal</title>
        {import.meta.env.DEV && <link rel="stylesheet" href={radixStylesUrl} />}
      </head>
      <body>
        <Theme>
          <Outlet />
        </Theme>
        <ScrollRestoration />
        {import.meta.env.DEV && <script type="module" src={entryClientUrl}></script>}
      </body>
    </html>
  )
}

export const root = createRoute({
  id: `root`, // todo remove
  path: `/`,
  Component,
  children: [
    index,
    reference,
  ],
})

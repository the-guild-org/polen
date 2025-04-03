import RadixThemesCssUrl from '@radix-ui/themes/styles.css?url'
import { Outlet, ScrollRestoration } from 'react-router'
import { Theme } from '@radix-ui/themes'
import entryClientUrl from '../entry.client.jsx?url'
import { createRoute } from '../../lib/react-router-helpers.js'
import { index } from './index.jsx'
import { reference } from './reference.jsx'

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
        <link rel="stylesheet" href={RadixThemesCssUrl} />
      </head>
      <body>
        <Theme>
          <Outlet />
        </Theme>
        <ScrollRestoration />
        {import.meta.env.PROD
          ? <script type="module" src="/assets/entry.client.js"></script>
          : <script type="module" src={entryClientUrl}></script>}
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

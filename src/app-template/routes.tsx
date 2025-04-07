import type { RouteObject } from 'react-router'
import { createRoute } from '../lib/react-router-helpers.js'
import entryClientUrl from './entry.client.jsx?url'

export const Component = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <script type="module" src={entryClientUrl}></script>
      </body>
    </html>
  )
}

export const root = createRoute({
  path: `/`,
  Component,
})

export const routes: RouteObject[] = [
  root,
]

import { RouterProvider, createBrowserRouter } from 'react-router'
import { routes } from './routes.jsx'
import { ReactDomClient } from '../lib/react-dom-client/_namespace.js'

const router = createBrowserRouter(routes, {
  // @ts-expect-error ignore
  // eslint-disable-next-line
  hydrationData: window.__staticRouterHydrationData,
})

ReactDomClient.hydrateRoot(
  document,
  <RouterProvider router={router} />,
)

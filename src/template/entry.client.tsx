import './styles/globals.css'
import { ReactDomClient } from '#dep/react-dom-client/index'
import { StrictMode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { routes } from './routes.js'

// SPA

// const router = createBrowserRouter(routes)

// createRoot(document).render(
//   <RouterProvider router={router} />,
// )

// SSR

const router = createBrowserRouter(routes, {
  ...(window.__staticRouterHydrationData && {
    hydrationData: window.__staticRouterHydrationData,
  }),
  ...(templateConfig.build.base !== '/' && {
    basename: templateConfig.build.base.slice(0, -1), // Remove trailing slash for React Router
  }),
})

const rootElement = document.getElementById(`app`)
if (!rootElement) {
  throw new Error(`Could not find app root element`)
}

ReactDomClient.hydrateRoot(
  rootElement,
  (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  ),
)

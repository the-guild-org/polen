import '@radix-ui/themes/styles.css'
import { ReactDomClient } from '#dep/react-dom-client/index'
import { StrictMode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { routes } from './routes.js'

// SPA

// const router = createBrowserRouter(routes)

// createRoot(document).render(
//   <RouterProvider router={router} />,
// )

// SSR

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
  basename: PROJECT_DATA.basePath === `/` ? undefined : PROJECT_DATA.basePath.slice(0, -1), // Remove trailing slash for React Router
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

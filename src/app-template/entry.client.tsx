// import { StartClient } from '@tanstack/react-start/client'
// import { createRouter } from './router.client.jsx'
// import { ReactDomClient } from '../lib/react-dom-client/_namespace.js'

// const router = createRouter()

// ReactDomClient.hydrateRoot(document, <StartClient router={router} />)

import { RouterProvider, createBrowserRouter } from 'react-router'
import { routes } from './routes.jsx'
import { ReactDomClient } from '../lib/react-dom-client/_namespace.js'
import { StrictMode } from 'react'

// SPA

// const rootElement = document.getElementById(`root`)
// if (!rootElement) throw new Error(`Root element not found. Looked for element with ID "root"`)

// const router = createBrowserRouter(routes)

// createRoot(rootElement).render(
//   <RouterProvider router={router} />,
// )

// SSR

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
})

ReactDomClient.hydrateRoot(
  document,
  (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  ),
)

// TODO it seems more logical to have this asset imported in the server entry.
// But then, we won't get it from the client manifest. But we could get it from the server manifest. Should we do that?
// But then, that wouldn't work for SPA. Does that matter? Just put a conditional here e.g. if (import.meta.env.PROD) ...?
import '@radix-ui/themes/styles.css'
// import './styles/code-block.css' // TODO: Handle CSS in build process
import { ReactDomClient } from '#dep/react-dom-client/index'
import { StrictMode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { routes } from './routes.jsx'

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

ReactDomClient.hydrateRoot(
  document,
  (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  ),
)

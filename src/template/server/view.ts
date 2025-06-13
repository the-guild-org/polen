import { createStaticHandler } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { routes } from '../routes.jsx'

export const view = createStaticHandler(routes, {
  basename: PROJECT_DATA.basePath === `/` ? undefined : PROJECT_DATA.basePath.slice(0, -1), // Remove trailing slash for React Router
})

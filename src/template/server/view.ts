import { createStaticHandler } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.json'
import { routes } from '../routes.js'

export const view = createStaticHandler(routes, {
  ...(PROJECT_DATA.basePath !== '/' && {
    basename: PROJECT_DATA.basePath.slice(0, -1), // Remove trailing slash for React Router
  }),
})

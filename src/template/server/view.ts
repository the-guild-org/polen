import { createStaticHandler } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { routes } from '../routes.js'

export const view = createStaticHandler(routes, {
  ...(templateConfig.build.base !== '/' && {
    basename: templateConfig.build.base.slice(0, -1), // Remove trailing slash for React Router
  }),
})

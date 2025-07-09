import { layout, route, type RouteConfig } from '@react-router/dev/routes'
import { routes as pageRoutes } from 'virtual:polen/project/routes.jsx'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'

console.log(pageRoutes)

export default [
  route('/', 'routes/index.tsx'),
  layout('routes/layout.sidebar.tsx', {}, [
    ...pageRoutes,
    ...(SCHEMA ? [
      route('reference', 'routes/reference.tsx', [
        route(':type', 'routes/reference.$type.tsx', [
          route(':field', 'routes/reference.$type.$field.tsx'),
        ]),
      ]),
      route('changelog', 'routes/changelog.tsx'),
    ] : []),
  ]),
  route('*', 'routes/404.tsx'),
] satisfies RouteConfig

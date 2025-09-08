import { Catalog } from '#lib/catalog/$'
import { route } from '#lib/react-router-effect/route'
import { SidebarLayout } from '#template/layouts/index'
import { Outlet, useLocation } from 'react-router'
import { pagesCatalog } from 'virtual:polen/project/pages'
import { routes } from 'virtual:polen/project/routes.jsx'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { MdxProvider } from '../providers/mdx.js'

const Component = () => {
  const location = useLocation()

  // Build sidebar from pages catalog
  // Get the top-level path segment (e.g., '/guide/foo' -> '/guide')
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const topLevelPath = pathSegments[0] ? `/${pathSegments[0]}` : '/'

  // Get the sidebar for this section
  const sidebar = pagesCatalog.sidebarIndex[topLevelPath]?.items || []

  // Get the latest schema for interactive GraphQL blocks
  const schema = schemasCatalog && Catalog.getLatest(schemasCatalog).definition

  return (
    <MdxProvider schema={schema}>
      <SidebarLayout sidebar={sidebar}>
        <Outlet />
      </SidebarLayout>
    </MdxProvider>
  )
}

export const pages = route({
  // Pathless layout route - doesn't affect URL paths
  Component,
  children: [...routes], // All MDX page routes go here
})

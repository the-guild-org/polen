import { Catalog } from '#api/examples/schemas/catalog'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Swiss } from '#lib/swiss/$'
import { Box, Flex, Heading } from '@radix-ui/themes'
import { Str } from '@wollybeard/kit'
import { Outlet } from 'react-router'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { Sidebar } from '../../components/sidebar/Sidebar.js'
import { examplesIndexRoute } from './_index.js'
import { nameRoute } from './name.js'

// ============================================================================
// Global Type Augmentation
// ============================================================================

declare global {
  interface RouteSchemaRegistry {
    'examples': typeof LayoutSchema
  }
}

// ============================================================================
// Schema
// ============================================================================

const LayoutSchema = Catalog

// ============================================================================
// Loader
// ============================================================================

export const layoutLoader = async () => {
  return examplesCatalog
}

// ============================================================================
// Component
// ============================================================================

export const LayoutComponent = () => {
  const examplesCatalog = useLoaderData(Catalog)

  const sidebarData = examplesCatalog.examples.map((example) => ({
    type: 'ItemLink',
    title: Str.Case.title(example.name),
    pathExp: example.name,
  })) ?? []

  return (
    <Swiss.Body subgrid>
      {/* Sidebar */}
      <Swiss.Item
        cols={4}
        style={{
          // width: '250px',
          // borderRight: '1px solid var(--gray-a5)',
          // padding: '1rem',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          // height: '100vh',
        }}
      >
        <Heading size='4' mb='4' style={{ paddingLeft: '1rem' }}>Examples</Heading>
        <Sidebar data={sidebarData as any} basePath='/examples' />
      </Swiss.Item>

      {/* Main content */}
      <Swiss.Item cols={8}>
        <Outlet />
      </Swiss.Item>
    </Swiss.Body>
  )
}

// ============================================================================
// Export
// ============================================================================

export const examplesRoute = route({
  path: 'examples',
  schema: LayoutSchema,
  loader: layoutLoader,
  Component: LayoutComponent,
  children: [
    examplesIndexRoute,
    nameRoute,
  ],
})

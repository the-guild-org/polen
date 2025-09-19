// TODO: Review and replace inline styles with Tailwind classes
import { Catalog } from '#api/examples/schemas/catalog'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Str } from '@wollybeard/kit'
import { Outlet } from 'react-router'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { Sidebar } from '../../components/sidebar/Sidebar.js'
import { Container, Grid, GridItem, Heading } from '../../components/ui/index.js'
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
    <Container>
      <Grid cols={12} gap='lg'>
        {/* Sidebar */}
        <GridItem
          span={4}
          className='overflow-y-auto sticky top-0'
        >
          <Heading size='4' className='mb-4 pl-4'>Examples</Heading>
          <Sidebar data={sidebarData as any} basePath='/examples' />
        </GridItem>

        {/* Main content */}
        <GridItem span={8}>
          <Outlet />
        </GridItem>
      </Grid>
    </Container>
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

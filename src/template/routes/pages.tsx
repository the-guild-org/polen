import { Catalog } from '#lib/catalog/$'
import { schemaRoute, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { PagesLoaderData } from '#lib/route-schemas/route-schemas'
import { SidebarLayout } from '#template/layouts/index'
import { MDXProvider } from '@mdx-js/react'
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Code,
  DataList,
  Em,
  Heading,
  Link,
  Quote,
  Separator,
  Strong,
  Table,
  Tabs,
  Text,
  Tooltip,
} from '@radix-ui/themes'
import { Effect, Match } from 'effect'
import { Outlet, useLocation } from 'react-router'
import PROJECT_DATA_PAGES_CATALOG from 'virtual:polen/project/data/pages-catalog.json'
import { routes } from 'virtual:polen/project/routes.jsx'
import { catalogBridge, hasCatalog } from '../catalog-bridge.js'
import { CodeBlock } from '../components/CodeBlock.js'

const pagesLoader = async () => {
  // Check if catalog exists first
  if (!hasCatalog()) {
    return { hasSchema: false }
  }

  // For now, we need to get the full catalog using view() until peek selections are implemented
  // view() returns the fully hydrated catalog
  const catalogData = await Effect.runPromise(catalogBridge.view())

  // Fetch the schema for MDX pages
  const schema = Match.value(catalogData).pipe(
    Match.tag('CatalogUnversioned', (catalog) => catalog.schema.definition),
    Match.tag('CatalogVersioned', (catalog) => {
      // Get latest version
      const latestEntry = catalog.entries[catalog.entries.length - 1]
      return latestEntry?.schema.definition
    }),
    Match.exhaustive,
  )

  // GraphQL schema objects can't be serialized directly over the wire
  // For now, we return a flag indicating if schema exists
  return { hasSchema: !!schema }
}

const Component = () => {
  // Data is automatically decoded using the schema
  const { hasSchema } = useLoaderData(PagesLoaderData)
  const location = useLocation()

  // Build sidebar from pages catalog
  // Get the top-level path segment (e.g., '/guide/foo' -> '/guide')
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const topLevelPath = pathSegments[0] ? `/${pathSegments[0]}` : '/'

  // Get the sidebar for this section
  const sidebar = PROJECT_DATA_PAGES_CATALOG.sidebarIndex[topLevelPath]?.items || []

  return (
    <MDXProvider
      components={{
        // Map markdown elements to Radix with spacing
        p: (props) => <Text as='p' mb='4' {...props} />,
        h1: (props) => <Heading size='8' mt='6' mb='4' {...props} />,
        h2: (props) => <Heading size='7' mt='6' mb='3' {...props} />,
        h3: (props) => <Heading size='6' mt='5' mb='3' {...props} />,
        h4: (props) => <Heading size='5' mt='5' mb='2' {...props} />,
        h5: (props) => <Heading size='4' mt='4' mb='2' {...props} />,
        h6: (props) => <Heading size='3' mt='4' mb='2' {...props} />,
        strong: Strong,
        em: Em,
        code: Code,
        blockquote: (props) => <Quote my='4' {...props} />,
        a: Link,
        hr: (props) => <Separator my='6' {...props} />,
        table: Table.Root,
        thead: Table.Header,
        tbody: Table.Body,
        tr: Table.Row,
        th: Table.ColumnHeaderCell,
        td: Table.Cell,
        // Lists need spacing too
        ul: (props) => <Box as='ul' mb='4' style={{ paddingLeft: '1.5rem' }} {...props} />,
        ol: (props) => <Box as='ol' mb='4' style={{ paddingLeft: '1.5rem' }} {...props} />,
        li: (props) => <Box as='li' mb='2' {...props} />,

        // Direct Radix components for MDX
        Badge,
        Button,
        // @ts-expect-error
        Callout,
        Card,
        // @ts-expect-error
        DataList,
        // @ts-expect-error
        Tabs,
        Tooltip,

        // Code Hike component - schema will be loaded client-side if needed
        CodeBlock: (props: any) => <CodeBlock {...props} schema={null} />,
      }}
    >
      <SidebarLayout sidebar={sidebar}>
        <Outlet />
      </SidebarLayout>
    </MDXProvider>
  )
}

export const pages = schemaRoute({
  // Pathless layout route - doesn't affect URL paths
  schema: PagesLoaderData,
  loader: pagesLoader,
  Component,
  children: [...routes], // All MDX page routes go here
})

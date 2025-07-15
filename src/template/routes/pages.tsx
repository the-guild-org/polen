import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
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
import { Outlet, useLocation } from 'react-router'
import { routes } from 'virtual:polen/project/routes.jsx'
import PROJECT_DATA_PAGES_CATALOG from 'virtual:polen/project/data/pages-catalog.jsonsuper'
import { CodeBlock } from '../components/CodeBlock.js'
import * as schemaSource from '../sources/schema-source.js'

const loader = createLoader(async () => {
  // Fetch the latest schema for MDX pages
  const schema = await schemaSource.get('latest')
  return { schema }
})

const Component = () => {
  const { schema } = useLoaderData<typeof loader>()
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

        // Code Hike component with schema injected
        CodeBlock: (props: any) => <CodeBlock {...props} schema={schema} />,
      }}
    >
      <SidebarLayout sidebar={sidebar}>
        <Outlet />
      </SidebarLayout>
    </MDXProvider>
  )
}

export const pages = createRoute({
  // Pathless layout route - doesn't affect URL paths
  loader,
  Component,
  children: [...routes], // All MDX page routes go here
})
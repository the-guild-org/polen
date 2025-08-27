import { route } from '#lib/react-router-effect/route'
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
import PROJECT_DATA_PAGES_CATALOG from 'virtual:polen/project/data/pages-catalog.json'
import { routes } from 'virtual:polen/project/routes.jsx'
import { CodeBlock } from '../components/CodeBlock.js'

const Component = () => {
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

export const pages = route({
  // Pathless layout route - doesn't affect URL paths
  Component,
  children: [...routes], // All MDX page routes go here
})

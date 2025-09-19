// TODO: Review and replace inline styles with Tailwind classes
import { MDXProvider } from '@mdx-js/react'
import type { GraphQLSchema } from 'graphql'
import type * as React from 'react'
import { CodeBlock } from '../components/CodeBlock.js'
import { GraphQLReference } from '../components/graphql/GraphQLReference.js'
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
  MDXComponents,
  Quote,
  Separator,
  Strong,
  Table,
  Tabs,
  Text,
  Tooltip,
} from '../components/ui/index.js'

interface MdxProviderProps extends React.PropsWithChildren {
  schema?: GraphQLSchema | null
}

export const MdxProvider: React.FC<MdxProviderProps> = ({ children, schema }) => (
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
      ul: (props) => <Box as='ul' mb='4' className='pl-6' {...props} />,
      ol: (props) => <Box as='ol' mb='4' className='pl-6' {...props} />,
      li: (props) => <Box as='li' mb='2' {...props} />,

      // Direct components for MDX
      Badge,
      Button,
      Card,
      Callout: MDXComponents.Callout,
      CalloutIcon: MDXComponents.CalloutIcon,
      CalloutText: MDXComponents.CalloutText,
      DataList: MDXComponents.DataList,
      DataListItem: MDXComponents.DataListItem,
      DataListLabel: MDXComponents.DataListLabel,
      DataListValue: MDXComponents.DataListValue,
      Tabs: MDXComponents.Tabs,
      TabsList: MDXComponents.TabsList,
      TabsTrigger: MDXComponents.TabsTrigger,
      TabsContent: MDXComponents.TabsContent,
      Tooltip: MDXComponents.Tooltip,
      TooltipTrigger: MDXComponents.TooltipTrigger,
      TooltipContent: MDXComponents.TooltipContent,

      // GraphQL reference component for MDX usage
      GraphQLReference,

      // Code Hike component - schema will be loaded client-side if needed
      CodeBlock: (props: any) => <CodeBlock {...props} schema={schema || undefined} />,
    }}
  >
    {children}
  </MDXProvider>
)

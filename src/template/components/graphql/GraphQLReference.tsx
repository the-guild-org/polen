import { Code, Flex } from '@radix-ui/themes'
import { Grafaid } from 'graphql-kit'
import { GraphQLSchemaPath } from 'graphql-kit'
import type * as React from 'react'
import { ReferenceLink } from '../reference/ReferenceLink.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

interface GraphQLReferenceProps {
  path: string
  version?: string
  kind?: Grafaid.Schema.TypeKindName
  children?: React.ReactNode
}

/**
 * Component for inline GraphQL references in MDX content.
 * Renders as inline styled link with icon to the reference documentation.
 *
 * @example
 * <GraphQLReference path="User.email" />
 * <GraphQLReference path="Query" />
 */
export const GraphQLReference: React.FC<GraphQLReferenceProps> = ({
  path,
  version, // Currently handled by useVersionPath in ReferenceLink
  kind,
  children,
}) => {
  // Parse the path to extract type and optional field
  let typeName: string | undefined
  let fieldName: string | undefined
  // Use the provided kind or default to 'Object'
  const typeKind: Grafaid.Schema.TypeKindName = kind || 'Object'

  try {
    // Try to parse with GraphQLSchemaPath for more robust handling
    const parsedPath = GraphQLSchemaPath.decodeSync(path) as any

    // Extract type name from the first segment
    if (parsedPath?.next) {
      const firstSegment = parsedPath.next
      if (firstSegment?._tag === 'GraphQLPathSegmentType') {
        typeName = firstSegment.name

        // Check for field segment
        if (firstSegment.next && firstSegment.next._tag === 'GraphQLPathSegmentField') {
          fieldName = firstSegment.next.name
        }
      }
    }
  } catch {
    // If parsing fails, render as plain text (not as a link)
    return <>{children || path}</>
  }

  // If we couldn't extract a type name, render as plain text
  if (!typeName) {
    return <>{children || path}</>
  }

  const color = typeKindTokensIndex[typeKind]?.color || 'gray'

  return (
    <>
      <style>
        {`
          .graphql-reference-link:hover code {
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        `}
      </style>
      <ReferenceLink
        type={typeName}
        {...(fieldName ? { field: fieldName } : {})}
        className='graphql-reference-link'
      >
        <Flex
          align='center'
          gap='1'
          display='inline-flex'
        >
          <TypeKindIcon kind={typeKind} />
          {` `}
          <Code color={color} variant='ghost'>
            {children || path}
          </Code>
        </Flex>
      </ReferenceLink>
    </>
  )
}

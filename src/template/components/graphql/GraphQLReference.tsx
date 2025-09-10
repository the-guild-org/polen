import { Grafaid } from '#lib/grafaid'
import { Code, Flex } from '@radix-ui/themes'
import type * as React from 'react'
import { ReferenceLink } from '../reference/ReferenceLink.js'
import { TypeKindIcon } from './graphql.js'
import { typeKindTokensIndex } from './type-kind-tokens.js'

interface GraphQLReferenceProps {
  path: string
  version?: string
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
  children,
}) => {
  // Parse the path to extract type and optional field
  const segments = path.split('.')
  const typeName = segments[0]
  const fieldName = segments[1]

  // Determine the type kind based on common GraphQL type names
  let typeKind: Grafaid.Schema.TypeKindName = 'Object' // Default

  // Common GraphQL root types
  if (typeName === 'Query' || typeName === 'Mutation' || typeName === 'Subscription') {
    typeKind = 'Object'
  } // Common suffix patterns
  else if (typeName?.endsWith('Input')) {
    typeKind = 'InputObject'
  } else if (typeName?.endsWith('Type') || typeName?.endsWith('Enum')) {
    typeKind = 'Enum'
  } else if (typeName?.endsWith('Interface')) {
    typeKind = 'Interface'
  } else if (typeName?.endsWith('Union')) {
    typeKind = 'Union'
  } else if (typeName?.endsWith('Connection') || typeName?.endsWith('Edge') || typeName?.endsWith('PageInfo')) {
    typeKind = 'Object'
  } // Special scalar types
  else if (
    typeName === 'String' || typeName === 'Int' || typeName === 'Float' || typeName === 'Boolean' || typeName === 'ID'
  ) {
    typeKind = 'Scalar'
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
        type={typeName!}
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

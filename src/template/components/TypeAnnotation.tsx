import type { React } from '#dep/react/index'
import { Text } from '@radix-ui/themes'
import type { GraphQLType } from 'graphql'
import { isInputObjectType, isListType, isNamedType, isNonNullType, isScalarType } from 'graphql'
import { ReferenceLink } from './ReferenceLink.js'

/**
 * Renders a GraphQL type recursively, with links for named types
 */
export const TypeAnnotation: React.FC<{ type: GraphQLType }> = ({ type }) => {
  // Handle NonNull type wrapper
  if (isNonNullType(type)) {
    return (
      <>
        <TypeAnnotation type={type.ofType} />
        <Text color='gray'>!</Text>
      </>
    )
  }

  // Handle List type wrapper
  if (isListType(type)) {
    return (
      <>
        <Text color='gray'>[</Text>
        <TypeAnnotation type={type.ofType} />
        <Text color='gray'>]</Text>
      </>
    )
  }

  // Handle named types
  if (isNamedType(type)) {
    const namedType = type

    // Handle input object types
    if (isInputObjectType(namedType)) {
      return (
        <ReferenceLink type={namedType.name}>
          <Text color='green'>{namedType.name}</Text>
        </ReferenceLink>
      )
    }

    // If it's an expandable type (object or interface), make it a link
    // if (Grafaid.isExpandableType(namedType)) {
    return (
      <ReferenceLink type={namedType.name}>
        <Text color={isScalarType(namedType) ? `purple` : `blue`}>{namedType.name}</Text>
      </ReferenceLink>
    )

    // For scalar and other non-expandable types, just render the name
    // return <Text color="purple">{namedType.name}</Text>
  }

  // Fallback for any other case (shouldn't happen in standard GraphQL usage)
  return <Text>{String(type)}</Text>
}

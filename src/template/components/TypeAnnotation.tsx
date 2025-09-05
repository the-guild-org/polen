import type { React } from '#dep/react/index'
import { Text } from '@radix-ui/themes'
import type { GraphQLType } from 'graphql'
import { isListType, isNamedType, isNonNullType } from 'graphql'
import { TypeLink } from './graphql/graphql.js'

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

  // Handle named types - use TypeLink which already has icon support
  if (isNamedType(type)) {
    return <TypeLink type={type} />
  }

  // TypeScript exhaustiveness check - this should be unreachable
  // as the above three cases cover all possible GraphQLType implementations
  const _exhaustive: never = type
  throw new Error(`Unexpected GraphQL type encountered: ${String(_exhaustive)}`)
}

/**
 * GraphQL type guard utilities for checking and narrowing GraphQL types.
 * This module provides type-safe helper functions for working with GraphQL types.
 */

import {
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLOutputType,
  getNamedType,
  isInterfaceType,
  isObjectType,
} from 'graphql';

/**
 * Type guard to check if a type is either a GraphQLObjectType or GraphQLInterfaceType.
 *
 * @param type - The GraphQL named type to check
 * @returns True if the type is either an object or interface type
 */
export const isObjectOrInterfaceType = (
  type: GraphQLNamedType,
): type is GraphQLObjectType | GraphQLInterfaceType => isObjectType(type) || isInterfaceType(type);

/**
 * Filters an array of GraphQL types to only include entry point types
 * (Query, Mutation, Subscription) that are object or interface types.
 *
 * @param types - Array of GraphQL named types to filter
 * @returns Array of entry point types that are object or interface types
 */
export const getEntryPointTypes = (
  types: readonly GraphQLNamedType[],
): readonly (GraphQLObjectType | GraphQLInterfaceType)[] =>
  types.filter((t): t is GraphQLObjectType | GraphQLInterfaceType =>
    ['Query', 'Mutation', 'Subscription'].includes(t.name) &&
    isObjectOrInterfaceType(t)
  );

/**
 * Filters an array of GraphQL types to only include non-entry point types
 * that are object or interface types.
 *
 * @param types - Array of GraphQL named types to filter
 * @param entryPoints - Array of entry point types to exclude
 * @returns Array of non-entry point types that are object or interface types
 */
export const getNonEntryPointTypes = (
  types: readonly GraphQLNamedType[],
  entryPoints: readonly (GraphQLObjectType | GraphQLInterfaceType)[],
): readonly (GraphQLObjectType | GraphQLInterfaceType)[] =>
  types.filter((t): t is GraphQLObjectType | GraphQLInterfaceType =>
    isObjectOrInterfaceType(t) &&
    !entryPoints.includes(t)
  );

/**
 * Gets the unwrapped named type from a GraphQLOutputType by removing any List or NonNull wrappers.
 *
 * @param type - The GraphQL output type to unwrap
 * @returns The unwrapped GraphQLNamedType
 */
export const getUnwrappedType = (type: GraphQLOutputType): GraphQLNamedType => {
  return getNamedType(type);
};

/**
 * Checks if a GraphQLOutputType is expandable (object or interface type).
 * This handles unwrapping non-null and list types to check the underlying named type.
 *
 * @param type - The GraphQL output type to check
 * @returns True if the unwrapped type is either an object or interface type
 */
export const isExpandableType = (type: GraphQLOutputType): boolean => {
  // Get the named type by unwrapping any List or NonNull wrappers
  const namedType = getUnwrappedType(type);

  // Check if the named type is an object or interface type
  return isObjectType(namedType) || isInterfaceType(namedType);
};

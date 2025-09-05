import type { Example } from '#api/examples/schemas/example/example'
import type { ExampleReference, TypeUsageIndex } from '#api/examples/schemas/type-usage-index'
import { getExampleReferencesForType } from '#api/examples/type-usage-indexer'
import { Version } from '#lib/version/$'
import { HashSet } from 'effect'
import { useMemo } from 'react'
import { examplesCatalog } from 'virtual:polen/project/examples'

/**
 * Hook to access the full examples catalog.
 */
export const useExamples = () => {
  return examplesCatalog
}

/**
 * Hook to get example references that use a specific GraphQL type.
 *
 * @param typeName - The name of the GraphQL type
 * @param version - Optional version to filter by (null for unversioned)
 * @returns HashSet of example references that use the specified type
 */
export const useExamplesForType = (
  typeName: string,
  version: Version.Version | null = null,
): HashSet.HashSet<ExampleReference> => {
  // The typeUsageIndex is already a HashMap thanks to the schema transformation
  const typeUsageIndex = examplesCatalog?.typeUsageIndex as TypeUsageIndex | undefined

  // Memoize the filtered example references
  return useMemo(() => {
    if (!typeUsageIndex) {
      return HashSet.empty<ExampleReference>()
    }

    // Get example references for this type and return them directly
    return getExampleReferencesForType(typeUsageIndex, typeName, version)
  }, [typeUsageIndex, typeName, version])
}

/**
 * Hook to check if any examples exist.
 */
export const useHasExamples = (): boolean => {
  return examplesCatalog?.examples?.length > 0
}

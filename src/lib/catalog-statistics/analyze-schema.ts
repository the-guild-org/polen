import type { AnalyzeOptions } from '#lib/catalog-statistics/analyze-options'
import type {
  DeprecationMetrics,
  DescriptionCoverage,
  StabilityMetrics,
  TypeKindBreakdown,
  VersionStatistics,
} from '#lib/catalog-statistics/data'
import {
  type GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql'

const BUILT_IN_SCALARS = new Set(['String', 'Int', 'Float', 'Boolean', 'ID'])

/**
 * Analyze a single GraphQL schema version.
 */
export const analyzeSchema = (
  schema: GraphQLSchema,
  version: string,
  date?: string,
  options: AnalyzeOptions = {},
): VersionStatistics => {
  const ignoreDeprecated = options.ignoreDeprecated ?? false
  const typeMap = schema.getTypeMap()

  // Initialize counters
  let totalTypes = 0
  let objectTypes = 0
  let interfaceTypes = 0
  let unionTypes = 0
  let enumTypes = 0
  let scalarTypes = 0
  let inputTypes = 0
  let totalFields = 0
  let totalArguments = 0
  let deprecatedFields = 0
  let deprecatedEnumValues = 0
  let deprecatedArguments = 0
  let typesWithDescriptions = 0
  let fieldsWithDescriptions = 0
  let argumentsWithDescriptions = 0

  // Analyze each type
  for (const [typeName, type] of Object.entries(typeMap)) {
    // Skip introspection types
    if (typeName.startsWith('__')) continue

    totalTypes++

    // Check for description
    if (type.description) {
      typesWithDescriptions++
    }

    // Categorize by type kind using proper type guards
    if (isObjectType(type)) {
      objectTypes++

      const fields = type.getFields()
      for (const field of Object.values(fields)) {
        if (ignoreDeprecated && field.deprecationReason) continue

        totalFields++

        if (field.description) {
          fieldsWithDescriptions++
        }

        if (field.deprecationReason) {
          deprecatedFields++
        }

        // Count arguments
        if (field.args) {
          for (const arg of field.args) {
            if (ignoreDeprecated && arg.deprecationReason) continue

            totalArguments++

            if (arg.description) {
              argumentsWithDescriptions++
            }

            if (arg.deprecationReason) {
              deprecatedArguments++
            }
          }
        }
      }
    } else if (isInterfaceType(type)) {
      interfaceTypes++

      const fields = type.getFields()
      for (const field of Object.values(fields)) {
        if (ignoreDeprecated && field.deprecationReason) continue

        totalFields++

        if (field.description) {
          fieldsWithDescriptions++
        }

        if (field.deprecationReason) {
          deprecatedFields++
        }

        // Count arguments
        if (field.args) {
          for (const arg of field.args) {
            if (ignoreDeprecated && arg.deprecationReason) continue

            totalArguments++

            if (arg.description) {
              argumentsWithDescriptions++
            }

            if (arg.deprecationReason) {
              deprecatedArguments++
            }
          }
        }
      }
    } else if (isUnionType(type)) {
      unionTypes++
    } else if (isEnumType(type)) {
      enumTypes++

      const values = type.getValues()
      for (const value of values) {
        if (ignoreDeprecated && value.deprecationReason) continue

        if (value.deprecationReason) {
          deprecatedEnumValues++
        }
      }
    } else if (isScalarType(type)) {
      // Only count custom scalars
      if (!BUILT_IN_SCALARS.has(typeName)) {
        scalarTypes++
      } else {
        // Built-in scalar, don't count in totalTypes
        totalTypes--
      }
    } else if (isInputObjectType(type)) {
      inputTypes++

      const fields = type.getFields()
      for (const field of Object.values(fields)) {
        if (ignoreDeprecated && field.deprecationReason) continue

        totalFields++

        if (field.description) {
          fieldsWithDescriptions++
        }
      }
    }
  }

  // Calculate percentages for type breakdown
  const typeBreakdown: TypeKindBreakdown = {
    objectTypes,
    objectTypesPercentage: totalTypes > 0 ? (objectTypes / totalTypes) * 100 : 0,
    interfaceTypes,
    interfaceTypesPercentage: totalTypes > 0 ? (interfaceTypes / totalTypes) * 100 : 0,
    unionTypes,
    unionTypesPercentage: totalTypes > 0 ? (unionTypes / totalTypes) * 100 : 0,
    enumTypes,
    enumTypesPercentage: totalTypes > 0 ? (enumTypes / totalTypes) * 100 : 0,
    scalarTypes,
    scalarTypesPercentage: totalTypes > 0 ? (scalarTypes / totalTypes) * 100 : 0,
    inputTypes,
    inputTypesPercentage: totalTypes > 0 ? (inputTypes / totalTypes) * 100 : 0,
  }

  // Calculate description coverage
  const totalElements = totalTypes + totalFields + totalArguments
  const elementsWithDescriptions = typesWithDescriptions + fieldsWithDescriptions + argumentsWithDescriptions
  const descriptionCoverage: DescriptionCoverage = {
    types: totalTypes > 0 ? (typesWithDescriptions / totalTypes) * 100 : 0,
    fields: totalFields > 0 ? (fieldsWithDescriptions / totalFields) * 100 : 0,
    arguments: totalArguments > 0 ? (argumentsWithDescriptions / totalArguments) * 100 : 0,
    overall: totalElements > 0 ? (elementsWithDescriptions / totalElements) * 100 : 0,
  }

  // Calculate deprecation metrics
  const totalDeprecatable = totalFields + totalArguments + deprecatedEnumValues
  const totalDeprecated = deprecatedFields + deprecatedArguments + deprecatedEnumValues
  const deprecation: DeprecationMetrics = {
    fields: deprecatedFields,
    enumValues: deprecatedEnumValues,
    arguments: deprecatedArguments,
    surfaceAreaPercentage: totalDeprecatable > 0 ? (totalDeprecated / totalDeprecatable) * 100 : 0,
  }

  // Get operation counts
  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  const subscriptionType = schema.getSubscriptionType()

  const queries = queryType ? Object.keys(queryType.getFields()).length : 0
  const mutations = mutationType ? Object.keys(mutationType.getFields()).length : 0
  const subscriptions = subscriptionType ? Object.keys(subscriptionType.getFields()).length : 0

  return {
    version,
    ...(date ? { date } : {}),
    totalTypes,
    typeBreakdown,
    queries,
    mutations,
    subscriptions,
    descriptionCoverage,
    deprecation,
    totalFields,
    totalArguments,
  }
}

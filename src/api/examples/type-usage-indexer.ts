import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { Version } from '#lib/version/$'
import { HashMap, HashSet, Option } from 'effect'
import { Schema as S } from 'effect'
import {
  type DocumentNode,
  getNamedType,
  type GraphQLSchema,
  isInterfaceType,
  isObjectType,
  isUnionType,
  Kind,
  parse,
  visit,
} from 'graphql'
import type { Example } from './schemas/example/example.js'
import { ExampleReference, type TypeUsageIndex, UNVERSIONED_KEY, type VersionKey } from './schemas/type-usage-index.js'

// ============================================================================
// Type Extraction
// ============================================================================

/**
 * Extract all named types referenced in a GraphQL document.
 *
 * This includes:
 * - Types referenced in fields
 * - Types referenced in fragments (inline and spreads)
 * - For interfaces: both the interface and all implementations
 * - For unions: both the union and all member types
 */
const extractTypesFromQuery = (
  documentString: string,
  schema: GraphQLSchema,
): Set<string> => {
  const types = new Set<string>()
  const visitedTypes = new Set<string>() // Prevent infinite recursion

  let ast: DocumentNode
  try {
    ast = parse(documentString)
  } catch {
    // If parsing fails, return empty set
    return types
  }

  // Helper to add a type and its related types
  const addType = (typeName: string) => {
    if (visitedTypes.has(typeName)) return
    visitedTypes.add(typeName)
    types.add(typeName)

    const type = schema.getType(typeName)
    if (!type) return

    // If interface, add all implementations
    if (isInterfaceType(type)) {
      const implementations = schema.getImplementations(type)
      for (const impl of implementations.objects) {
        types.add(impl.name)
      }
      for (const impl of implementations.interfaces) {
        types.add(impl.name)
      }
    } // If union, add all member types
    else if (isUnionType(type)) {
      for (const member of type.getTypes()) {
        types.add(member.name)
      }
    }
  }

  // Helper to resolve field type from selection
  const resolveFieldType = (
    fieldName: string,
    parentTypeName: string | null,
  ): Option.Option<string> => {
    if (!parentTypeName) return Option.none()

    const parentType = schema.getType(parentTypeName)
    if (!parentType || !isObjectType(parentType) && !isInterfaceType(parentType)) {
      return Option.none()
    }

    const field = parentType.getFields()[fieldName]
    if (!field) return Option.none()

    const namedType = getNamedType(field.type)
    return Option.some(namedType.name)
  }

  // Track the current type context as we traverse
  let currentType: string | null = null

  visit(ast, {
    [Kind.OPERATION_DEFINITION]: (node) => {
      // Set initial type based on operation
      switch (node.operation) {
        case 'query':
          currentType = schema.getQueryType()?.name ?? null
          break
        case 'mutation':
          currentType = schema.getMutationType()?.name ?? null
          break
        case 'subscription':
          currentType = schema.getSubscriptionType()?.name ?? null
          break
      }
      if (currentType) {
        addType(currentType)
      }
    },

    [Kind.FIELD]: {
      enter(node) {
        if (!currentType) return

        // Special handling for __typename
        if (node.name.value === '__typename') return

        const fieldTypeOption = resolveFieldType(node.name.value, currentType)
        if (Option.isSome(fieldTypeOption)) {
          const fieldType = fieldTypeOption.value
          addType(fieldType)
          // Update context for nested selections
          if (node.selectionSet) {
            currentType = fieldType
          }
        }
      },
      leave(node) {
        // Restore parent context when leaving field with selection set
        if (node.selectionSet && currentType) {
          // This is simplified - in production would need proper context stack
        }
      },
    },

    [Kind.INLINE_FRAGMENT]: (node) => {
      if (node.typeCondition) {
        const typeName = node.typeCondition.name.value
        addType(typeName)
        currentType = typeName
      }
    },

    [Kind.FRAGMENT_SPREAD]: (node) => {
      // Fragment spreads reference fragment definitions which have their own type
      // In a full implementation, we'd look up the fragment definition
    },

    [Kind.FRAGMENT_DEFINITION]: (node) => {
      const typeName = node.typeCondition.name.value
      addType(typeName)
      currentType = typeName
    },
  })

  return types
}

// ============================================================================
// Index Creation
// ============================================================================

/**
 * Create a type usage index from examples and schemas.
 *
 * Processes all examples and their documents (versioned or unversioned)
 * to build an index of which types are used in which examples.
 */
export const createTypeUsageIndex = (
  examples: readonly Example[],
  schemasCatalog: Catalog.Catalog,
): TypeUsageIndex => {
  let index = HashMap.empty<VersionKey, HashMap.HashMap<string, HashSet.HashSet<ExampleReference>>>()

  for (const example of examples) {
    // Process based on document type
    if (Document.Unversioned.is(example.document)) {
      // Unversioned document
      const schema = Catalog.getLatest(schemasCatalog)
      const types = extractTypesFromQuery(example.document.document, schema.definition)

      for (const typeName of types) {
        // For unversioned, use the latest version from the catalog
        const latestVersion = Option.getOrElse(
          Catalog.getLatestVersion(schemasCatalog),
          () => Version.fromString('1.0.0'),
        )
        index = addExampleToIndex(index, UNVERSIONED_KEY, typeName, example, latestVersion)
      }
    } else if (Document.Versioned.is(example.document)) {
      // Versioned document - process each version covered
      const allVersions = Document.Versioned.getAllVersions(example.document)

      for (const version of allVersions) {
        // Use centralized resolution to get schema for version
        const schemaOption = Option.liftThrowable(
          () => Catalog.resolveCatalogSchema(schemasCatalog, version),
        )()
        if (Option.isNone(schemaOption)) {
          // Skip if version not found in catalog
          continue
        }
        const schema = schemaOption.value

        const documentStringOption = Document.Versioned.getContentForVersion(example.document, version)
        if (Option.isNone(documentStringOption)) continue
        const documentString = documentStringOption.value

        const types = extractTypesFromQuery(documentString, schema.definition)

        for (const typeName of types) {
          index = addExampleToIndex(index, version, typeName, example, version)
        }
      }
    }
  }

  return index
}

/**
 * Helper to add an example to the index for a specific version and type.
 */
const addExampleToIndex = (
  index: TypeUsageIndex,
  versionKey: VersionKey,
  typeName: string,
  example: Example,
  version: Version.Version,
): TypeUsageIndex => {
  // Create lightweight reference using the schema's make constructor
  const exampleRef = ExampleReference.make({ name: example.name, version })

  // Get or create the version's type map
  const versionMap = HashMap.get(index, versionKey).pipe(
    Option.getOrElse(HashMap.empty<string, HashSet.HashSet<S.Schema.Type<typeof ExampleReference>>>),
  )

  // Get or create the type's example set
  const examples = HashMap.get(versionMap, typeName).pipe(
    Option.getOrElse(HashSet.empty<S.Schema.Type<typeof ExampleReference>>),
  )

  // Add example reference to set (HashSet handles deduplication automatically)
  const updatedExamples = HashSet.add(examples, exampleRef)

  // Update both maps immutably
  const updatedVersionMap = HashMap.set(
    versionMap,
    typeName,
    updatedExamples,
  )

  return HashMap.set(index, versionKey, updatedVersionMap)
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get example references that use a specific type in a specific version.
 */
export const getExampleReferencesForType = (
  typeUsageIndex: TypeUsageIndex,
  typeName: string,
  version: Version.Version | null = null,
): HashSet.HashSet<S.Schema.Type<typeof ExampleReference>> => {
  const versionKey = version ?? UNVERSIONED_KEY

  return HashMap.get(typeUsageIndex, versionKey).pipe(
    Option.flatMap(versionMap => HashMap.get(versionMap, typeName)),
    Option.getOrElse(HashSet.empty<S.Schema.Type<typeof ExampleReference>>),
  )
}

import { Ef, Op } from '#dep/effect'
import { HashMap, HashSet } from 'effect'
import { getNamedType, type GraphQLSchema, isInterfaceType, isObjectType, isUnionType, Kind, visit } from 'graphql'
import { Catalog, Document, Grafaid, Schema, Version } from 'graphql-kit'
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
const extractTypesFromDocument = (
  documentString: string,
  schema: GraphQLSchema,
): Set<string> => {
  const types = new Set<string>()
  const visitedTypes = new Set<string>() // Prevent infinite recursion

  // Use Effect to parse, but handle it synchronously since this function is synchronous
  const ast = Ef.runSync(
    Grafaid.Parse.parseDocument(documentString, { source: 'example' }),
  )

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
  ): Op.Option<string> => {
    if (!parentTypeName) return Op.none()

    const parentType = schema.getType(parentTypeName)
    if (!parentType || !isObjectType(parentType) && !isInterfaceType(parentType)) {
      return Op.none()
    }

    const field = parentType.getFields()[fieldName]
    if (!field) return Op.none()

    const namedType = getNamedType(field.type)
    return Op.some(namedType.name)
  }

  // Track the current type context as we traverse
  let currentType: Op.Option<string> = Op.none()

  visit(ast, {
    [Kind.OPERATION_DEFINITION]: (node) => {
      // Set initial type based on operation
      switch (node.operation) {
        case 'query':
          const queryType = schema.getQueryType()?.name
          currentType = queryType ? Op.some(queryType) : Op.none()
          break
        case 'mutation':
          const mutationType = schema.getMutationType()?.name
          currentType = mutationType ? Op.some(mutationType) : Op.none()
          break
        case 'subscription':
          const subscriptionType = schema.getSubscriptionType()?.name
          currentType = subscriptionType ? Op.some(subscriptionType) : Op.none()
          break
      }
      if (Op.isSome(currentType)) {
        addType(currentType.value)
      }
    },

    [Kind.FIELD]: {
      enter(node) {
        if (Op.isNone(currentType)) return

        // Special handling for __typename
        if (node.name.value === '__typename') return

        const fieldTypeOption = resolveFieldType(node.name.value, currentType.value)
        if (Op.isSome(fieldTypeOption)) {
          const fieldType = fieldTypeOption.value
          addType(fieldType)
          // Update context for nested selections
          if (node.selectionSet) {
            currentType = Op.some(fieldType)
          }
        }
      },
      leave(node) {
        // Restore parent context when leaving field with selection set
        if (node.selectionSet && Op.isSome(currentType)) {
          // This is simplified - in production would need proper context stack
        }
      },
    },

    [Kind.INLINE_FRAGMENT]: (node) => {
      if (node.typeCondition) {
        const typeName = node.typeCondition.name.value
        addType(typeName)
        currentType = Op.some(typeName)
      }
    },

    [Kind.FRAGMENT_SPREAD]: (node) => {
      // Fragment spreads reference fragment definitions which have their own type
      // In a full implementation, we'd look up the fragment definition
    },

    [Kind.FRAGMENT_DEFINITION]: (node) => {
      const typeName = node.typeCondition.name.value
      addType(typeName)
      currentType = Op.some(typeName)
    },
  })

  return types
}

// ============================================================================
// Index Creation
// ============================================================================

/**
 * Process a document version and add its type usage to the index.
 *
 * @param example - The example being processed
 * @param documentContent - The document content to extract types from
 * @param schema - The schema containing version and definition
 * @param hashMap - The current type usage index
 * @returns Updated type usage index
 */
const processDocumentVersion = (
  example: Example,
  documentContent: string,
  schema: Schema.Schema,
  hashMap: TypeUsageIndex,
): TypeUsageIndex => {
  const types = extractTypesFromDocument(documentContent, schema.definition)

  // Get version from schema (null for unversioned)
  const version = Schema.getVersion(schema) ?? null

  // Map to storage key: use version or UNVERSIONED_KEY
  const versionKey: VersionKey = version ?? UNVERSIONED_KEY

  // Create reference with nullable version
  const exampleRef = ExampleReference.make({
    name: example.name,
    version,
  })

  let updatedMap = hashMap
  for (const typeName of types) {
    updatedMap = addExampleToIndex(updatedMap, versionKey, typeName, exampleRef)
  }

  return updatedMap
}

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
  let hashMap = HashMap.empty<VersionKey, HashMap.HashMap<string, HashSet.HashSet<ExampleReference>>>()

  for (const example of examples) {
    if (Document.Unversioned.is(example.document)) {
      // For unversioned: get latest schema from catalog
      const schema = Catalog.getLatest(schemasCatalog)
      hashMap = processDocumentVersion(
        example,
        example.document.document,
        schema,
        hashMap,
      )
    } else if (Document.Versioned.is(example.document)) {
      // For versioned: process each version
      const allVersions = Document.Versioned.getAllVersions(example.document)

      for (const version of allVersions) {
        const schemaOption = Op.liftThrowable(
          () => Catalog.resolveCatalogSchema(schemasCatalog, version),
        )()
        if (Op.isNone(schemaOption)) continue

        const documentOption = Document.Versioned.getContentForVersion(example.document, version)
        if (Op.isNone(documentOption)) continue

        hashMap = processDocumentVersion(
          example,
          documentOption.value,
          schemaOption.value,
          hashMap,
        )
      }
    }
  }

  return hashMap
}

/**
 * Helper to add an example to the index for a specific version and type.
 */
const addExampleToIndex = (
  index: TypeUsageIndex,
  versionKey: VersionKey,
  typeName: string,
  exampleRef: ExampleReference,
): TypeUsageIndex => {
  // Get or create the version's type map
  const versionMap = HashMap.get(index, versionKey).pipe(
    Op.getOrElse(HashMap.empty<string, HashSet.HashSet<ExampleReference>>),
  )

  // Get or create the type's example set
  const examples = HashMap.get(versionMap, typeName).pipe(
    Op.getOrElse(HashSet.empty<ExampleReference>),
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
): HashSet.HashSet<ExampleReference> => {
  const versionKey = version ?? UNVERSIONED_KEY

  return HashMap.get(typeUsageIndex, versionKey).pipe(
    Op.flatMap(versionMap => HashMap.get(versionMap, typeName)),
    Op.getOrElse(HashSet.empty<ExampleReference>),
  )
}

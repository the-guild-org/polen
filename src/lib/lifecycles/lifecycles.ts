import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { Grafaid } from '#lib/grafaid'
import { S } from '#lib/kit-temp/effect'
import { Revision } from '#lib/revision/$'
import { SchemaDefinition } from '#lib/schema-definition/$'
import { Schema } from '#lib/schema/$'
import { Match } from 'effect'
import {
  type DocumentNode,
  type GraphQLNamedType,
  GraphQLSchema,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
} from 'graphql'
import { LifecycleEvent } from './lifecycle-event/$.js'
import { Lifecycle } from './lifecycle/$.js'

const kindToTagMap = Lifecycle.GraphQLKindToLifecycleTag
// ============================================================================
// Lifecycles Container
// ============================================================================

export const Lifecycles = S.TaggedStruct('Lifecycles', {
  data: S.Record({ key: S.String, value: Lifecycle.Lifecycle }),
})

export type Lifecycles = S.Schema.Type<typeof Lifecycles>

// ============================================================================
// Constructors
// ============================================================================

export const make = Lifecycles.make

// ============================================================================
// Guards
// ============================================================================

export const is = S.is(Lifecycles)

// ============================================================================
// Codecs
// ============================================================================

// Note: Due to TS2345 error with complex schema types, we need to use type assertions
export const decode = S.decodeUnknown(Lifecycles as any)
export const decodeSync = S.decodeUnknownSync(Lifecycles as any)
export const encode = S.encodeUnknown(Lifecycles as any)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Lifecycles)

// ============================================================================
// Type Aliases
// ============================================================================

// Explicit type for Schema to avoid inference issues
type SchemaType = S.Schema.Type<typeof Schema.Schema>

// Re-export FieldType for backward compatibility
type FieldLifecycle = Lifecycle.FieldType.FieldType

// ============================================================================
// Domain Logic - Helper Functions
// ============================================================================

/**
 * Populate fields for a type that has fields (Object, Interface, or InputObject types)
 */
const populateTypeFields = (
  typeLifecycle: Lifecycle.Lifecycle,
  graphqlType: GraphQLNamedType,
  addedEvent: LifecycleEvent.LifecycleEvent,
) => {
  if (isObjectType(graphqlType) || isInterfaceType(graphqlType) || isInputObjectType(graphqlType)) {
    const fields = graphqlType.getFields()
    const typeWithFields = typeLifecycle as
      | Lifecycle.ObjectType.ObjectType
      | Lifecycle.InterfaceType.InterfaceType
      | Lifecycle.InputObjectType.InputObjectType

    for (const fieldName of Object.keys(fields)) {
      ;(typeWithFields.fields as any)[fieldName] = Lifecycle.FieldType.make({
        name: fieldName,
        events: [addedEvent],
      })
    }
  }
}

/**
 * Process initial schema to create lifecycle entries for all types and fields
 */
const processInitialSchema = (
  data: Record<string, Lifecycle.Lifecycle>,
  schema: GraphQLSchema | DocumentNode,
  revision: Revision.Revision,
  schemaHydratable: SchemaType,
) => {
  // Ensure schema is a GraphQLSchema instance
  const graphqlSchema = schema instanceof GraphQLSchema
    ? schema
    : SchemaDefinition.decodeSync(schema)
  const typeMap = graphqlSchema.getTypeMap()

  const addedEvent = LifecycleEvent.make('LifecycleEventAdded', {
    schema: schemaHydratable,
    revision: revision,
  })

  for (const [typeName, graphqlType] of Object.entries(typeMap)) {
    // Skip built-in types that start with __
    if (typeName.startsWith('__')) continue
    if (!isNamedType(graphqlType)) continue

    const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
    const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
    const tag = kindToTagMap[namedKind]
    const fields = (kind === 'Object' || kind === 'Interface' || kind === 'InputObject') ? { fields: {} } : {}
    const typeLifecycle = Lifecycle.make(tag, {
      name: typeName,
      events: [addedEvent],
      ...fields,
    })
    data[typeName] = typeLifecycle

    // Populate fields for types that have them
    populateTypeFields(typeLifecycle, graphqlType, addedEvent)
  }
}

/**
 * Process a single change and update lifecycle data
 */
const processChange = (
  data: Record<string, Lifecycle.Lifecycle>,
  change: Change.Change,
  revision: Revision.Revision,
  schema: GraphQLSchema | DocumentNode,
  schemaHydratable: SchemaType,
) => {
  // Ensure schema is a GraphQLSchema instance
  const graphqlSchema = schema instanceof GraphQLSchema
    ? schema
    : SchemaDefinition.decodeSync(schema)
  const eventFields = {
    schema: schemaHydratable,
    revision: revision,
  }

  const createEvent = (type: 'Added' | 'Removed') => {
    return type === 'Added'
      ? LifecycleEvent.make('LifecycleEventAdded', eventFields)
      : LifecycleEvent.make('LifecycleEventRemoved', eventFields)
  }

  // Handle all change types using Match
  Match.value(change).pipe(
    Match.tag('TYPE_ADDED', (change) => {
      const typeName = change.name
      const graphqlType = graphqlSchema.getType(typeName)

      if (!graphqlType || !isNamedType(graphqlType)) {
        throw new Error(`Type ${typeName} not found in schema`)
      }

      const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
      const addedEvent = createEvent('Added')
      const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
      const tag = kindToTagMap[namedKind]
      const fields = (kind === 'Object' || kind === 'Interface' || kind === 'InputObject') ? { fields: {} } : {}
      const typeLifecycle = Lifecycle.make(tag, {
        name: typeName,
        events: [addedEvent],
        ...fields,
      })
      data[typeName] = typeLifecycle

      // Populate fields for types that have them
      populateTypeFields(typeLifecycle, graphqlType, addedEvent)
    }),
    Match.tag('TYPE_REMOVED', (change) => {
      const typeName = change.name
      if (data[typeName]) {
        const removedEvent = createEvent('Removed')
        data[typeName] = {
          ...data[typeName],
          events: [removedEvent, ...data[typeName].events],
        }
      }
    }),
    Match.tag('FIELD_ADDED', (change) => {
      const { typeName, fieldName } = change
      const addedEvent = createEvent('Added')

      // Ensure type exists
      if (!data[typeName]) {
        const graphqlType = graphqlSchema.getType(typeName)
        if (!graphqlType || !isNamedType(graphqlType)) {
          throw new Error(`Type ${typeName} not found in schema`)
        }

        const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
        const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
        const tag = kindToTagMap[namedKind]
        const fields = (kind === 'Object' || kind === 'Interface' || kind === 'InputObject') ? { fields: {} } : {}
        data[typeName] = Lifecycle.make(tag, {
          name: typeName,
          events: [addedEvent],
          ...fields,
        })
      }

      const typeLifecycle = data[typeName]
      if ('fields' in typeLifecycle) {
        ;(typeLifecycle.fields as any)[fieldName] = Lifecycle.FieldType.make({
          name: fieldName,
          events: [addedEvent],
        })
      }
    }),
    Match.tag('FIELD_REMOVED', (change) => {
      const { typeName, fieldName } = change
      const removedEvent = createEvent('Removed')

      const typeLifecycle = data[typeName]
      if (typeLifecycle && 'fields' in typeLifecycle && typeLifecycle.fields[fieldName]) {
        ;(typeLifecycle.fields as any)[fieldName] = {
          ...typeLifecycle.fields[fieldName],
          events: [removedEvent, ...typeLifecycle.fields[fieldName].events],
        }
      }
    }),
    Match.tag('INPUT_FIELD_ADDED', (change) => {
      const { inputName: typeName, fieldName } = change
      const addedEvent = createEvent('Added')

      // Ensure type exists
      if (!data[typeName]) {
        const graphqlType = graphqlSchema.getType(typeName)
        if (!graphqlType || !isNamedType(graphqlType)) {
          throw new Error(`Type ${typeName} not found in schema`)
        }

        const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
        const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
        const tag = kindToTagMap[namedKind]
        const fields = (kind === 'Object' || kind === 'Interface' || kind === 'InputObject') ? { fields: {} } : {}
        data[typeName] = Lifecycle.make(tag, {
          name: typeName,
          events: [addedEvent],
          ...fields,
        })
      }

      const typeLifecycle = data[typeName]
      if ('fields' in typeLifecycle) {
        ;(typeLifecycle.fields as any)[fieldName] = Lifecycle.FieldType.make({
          name: fieldName,
          events: [addedEvent],
        })
      }
    }),
    Match.tag('INPUT_FIELD_REMOVED', (change) => {
      const { inputName: typeName, fieldName } = change
      const removedEvent = createEvent('Removed')

      const typeLifecycle = data[typeName]
      if (typeLifecycle && 'fields' in typeLifecycle && typeLifecycle.fields[fieldName]) {
        ;(typeLifecycle.fields as any)[fieldName] = {
          ...typeLifecycle.fields[fieldName],
          events: [removedEvent, ...typeLifecycle.fields[fieldName].events],
        }
      }
    }),
    Match.tag('ENUM_VALUE_ADDED', (change) => {
      const { enumName } = change
      const addedEvent = createEvent('Added')

      // Ensure enum type exists
      if (!data[enumName]) {
        const graphqlType = graphqlSchema.getType(enumName)
        if (!graphqlType || !isNamedType(graphqlType)) {
          throw new Error(`Enum ${enumName} not found in schema`)
        }

        const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
        const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
        const tag = kindToTagMap[namedKind]
        data[enumName] = Lifecycle.make(tag, {
          name: enumName,
          events: [addedEvent],
        })
      }
    }),
    Match.tag('ENUM_VALUE_REMOVED', (change) => {
      const { enumName } = change
      // For enum values, we track at the type level
      if (data[enumName]) {
        // We could track individual enum values if needed
      }
    }),
    Match.tag('UNION_MEMBER_ADDED', (change) => {
      const { unionName } = change
      const addedEvent = createEvent('Added')

      // Ensure union type exists
      if (!data[unionName]) {
        const graphqlType = graphqlSchema.getType(unionName)
        if (!graphqlType || !isNamedType(graphqlType)) {
          throw new Error(`Union ${unionName} not found in schema`)
        }

        const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
        const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
        const tag = kindToTagMap[namedKind]
        data[unionName] = Lifecycle.make(tag, {
          name: unionName,
          events: [addedEvent],
        })
      }
    }),
    Match.tag('UNION_MEMBER_REMOVED', (change) => {
      const { unionName } = change
      // For union members, we track at the type level
      if (data[unionName]) {
        // We could track individual union members if needed
      }
    }),
    Match.tag('OBJECT_TYPE_INTERFACE_ADDED', (change) => {
      const { objectName } = change
      const addedEvent = createEvent('Added')

      // Ensure object type exists
      if (!data[objectName]) {
        const graphqlType = graphqlSchema.getType(objectName)
        if (!graphqlType || !isNamedType(graphqlType)) {
          throw new Error(`Object ${objectName} not found in schema`)
        }

        const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
        const namedKind = kind as Exclude<Grafaid.Schema.TypeKindName, 'List' | 'NonNull'>
        const tag = kindToTagMap[namedKind]
        const fields = (kind === 'Object' || kind === 'Interface' || kind === 'InputObject') ? { fields: {} } : {}
        data[objectName] = Lifecycle.make(tag, {
          name: objectName,
          events: [addedEvent],
          ...fields,
        })
      }
    }),
    Match.tag('OBJECT_TYPE_INTERFACE_REMOVED', (change) => {
      const { objectName } = change
      // For interface implementations, we track at the type level
      if (data[objectName]) {
        // We could track individual interface implementations if needed
      }
    }),
    // All other change types don't affect lifecycle tracking
    Match.orElse(() => {
      // Note: Directive changes, schema root type changes, and description/deprecation changes
      // don't affect the lifecycle tracking since we focus on types and fields being added/removed
    }),
  )
}

// ============================================================================
// Domain Logic - Create Function
// ============================================================================

/**
 * Build lifecycle data from a catalog
 */
export const create = (catalog: Catalog.Catalog): Lifecycles => {
  const data: Record<string, Lifecycle.Lifecycle> = {}

  // Handle versioned vs unversioned catalogs
  const processUnversionedCatalog = (cat: Catalog.Unversioned.Unversioned) => {
    const revisions = [...cat.schema.revisions].reverse() // Process chronologically

    // Create the hydrated schema for unversioned catalog using proper constructors
    const schemaHydratable: SchemaType = Schema.Unversioned.make({
      revisions: cat.schema.revisions.map((r: any) =>
        Revision.make({
          date: r.date,
          changes: r.changes,
        })
      ),
      definition: cat.schema.definition,
    })

    // Process first revision as initial schema
    if (revisions.length > 0) {
      const firstRevision = revisions[0]!
      // Ensure schema definition is a GraphQLSchema instance
      const schemaDef = cat.schema.definition
      const schema = schemaDef instanceof GraphQLSchema
        ? schemaDef
        : SchemaDefinition.decodeSync(schemaDef)
      processInitialSchema(data, schema, firstRevision, schemaHydratable)

      // Process subsequent revisions
      for (let i = 1; i < revisions.length; i++) {
        const revision = revisions[i]!
        for (const change of revision.changes) {
          processChange(data, change, revision, schema, schemaHydratable)
        }
      }
    }
  }

  const processVersionedCatalog = (cat: Catalog.Versioned.Versioned) => {
    // For versioned catalog, process each version's revisions
    for (const entry of cat.entries) {
      const revisions = [...entry.revisions].reverse() // Process chronologically

      // Create the hydrated schema for versioned catalog using proper constructors
      const schemaHydratable: SchemaType = Schema.Versioned.make({
        version: entry.schema.version,
        parent: entry.parent
          ? Schema.Versioned.make({
            version: entry.parent.version,
            parent: null,
            revisions: [],
            definition: entry.parent.definition,
          })
          : null,
        revisions: entry.revisions.map(r =>
          Revision.make({
            date: r.date,
            changes: r.changes,
          })
        ),
        definition: entry.schema.definition,
      })

      // Process first revision as initial schema
      if (revisions.length > 0) {
        const firstRevision = revisions[0]!
        // Ensure schema definition is a GraphQLSchema instance
        const schemaDef = entry.schema.definition
        const schema = schemaDef instanceof GraphQLSchema
          ? schemaDef
          : SchemaDefinition.decodeSync(schemaDef)
        processInitialSchema(data, schema, firstRevision, schemaHydratable)

        // Process subsequent revisions
        for (let i = 1; i < revisions.length; i++) {
          const revision = revisions[i]!
          for (const change of revision.changes) {
            processChange(data, change, revision, schema, schemaHydratable)
          }
        }
      }
    }
  }

  // Process based on catalog type
  Catalog.fold(
    processVersionedCatalog,
    processUnversionedCatalog,
  )(catalog)

  return make({ data })
}

// ============================================================================
// Domain Logic - Utility Functions
// ============================================================================

/**
 * Get lifecycle for a specific type
 */
export const getTypeLifecycle = (lifecycles: Lifecycles, typeName: string): Lifecycle.Lifecycle | undefined => {
  return lifecycles.data[typeName]
}

/**
 * Get lifecycle for a specific field
 */
export const getFieldLifecycle = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): FieldLifecycle | undefined => {
  const typeLifecycle = lifecycles.data[typeName]
  if (typeLifecycle && 'fields' in typeLifecycle) {
    return typeLifecycle.fields[fieldName]
  }
  return undefined
}

/**
 * Get the date when a type was added
 */
export const getTypeAddedDate = (lifecycles: Lifecycles, typeName: string): Date | undefined => {
  const typeLifecycle = lifecycles.data[typeName]
  if (!typeLifecycle) return undefined

  // Find the first (oldest) added event
  for (let i = typeLifecycle.events.length - 1; i >= 0; i--) {
    const event = typeLifecycle.events[i]
    if (event) {
      const result = Match.value(event).pipe(
        Match.tag('LifecycleEventAdded', (e) => new Date(e.revision.date)),
        Match.orElse(() => undefined),
      )
      if (result) return result
    }
  }
  return undefined
}

/**
 * Get the date when a type was removed
 */
export const getTypeRemovedDate = (lifecycles: Lifecycles, typeName: string): Date | undefined => {
  const typeLifecycle = lifecycles.data[typeName]
  if (!typeLifecycle) return undefined

  // Find the most recent removed event
  for (const event of typeLifecycle.events) {
    const result = Match.value(event).pipe(
      Match.tag('LifecycleEventRemoved', (e) => new Date(e.revision.date)),
      Match.orElse(() => undefined),
    )
    if (result) return result
  }
  return undefined
}

/**
 * Check if a type is currently available (not removed)
 */
export const isTypeCurrentlyAvailable = (lifecycles: Lifecycles, typeName: string): boolean => {
  const typeLifecycle = lifecycles.data[typeName]
  if (!typeLifecycle) return false

  // Type is available if the most recent event is not a removal
  const mostRecentEvent = typeLifecycle.events[0]
  if (!mostRecentEvent) return true

  return Match.value(mostRecentEvent).pipe(
    Match.tag('LifecycleEventRemoved', () => false),
    Match.orElse(() => true),
  )
}

/**
 * Get the date when a field was added
 */
export const getFieldAddedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): Date | undefined => {
  const fieldLifecycle = getFieldLifecycle(lifecycles, typeName, fieldName)
  if (!fieldLifecycle) return undefined

  // Find the first (oldest) added event
  for (let i = fieldLifecycle.events.length - 1; i >= 0; i--) {
    const event = fieldLifecycle.events[i]
    if (event) {
      const result = Match.value(event).pipe(
        Match.tag('LifecycleEventAdded', (e) => new Date(e.revision.date)),
        Match.orElse(() => undefined),
      )
      if (result) return result
    }
  }
  return undefined
}

/**
 * Get the date when a field was removed
 */
export const getFieldRemovedDate = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): Date | undefined => {
  const fieldLifecycle = getFieldLifecycle(lifecycles, typeName, fieldName)
  if (!fieldLifecycle) return undefined

  // Find the most recent removed event
  for (const event of fieldLifecycle.events) {
    const result = Match.value(event).pipe(
      Match.tag('LifecycleEventRemoved', (e) => new Date(e.revision.date)),
      Match.orElse(() => undefined),
    )
    if (result) return result
  }
  return undefined
}

/**
 * Check if a field is currently available (not removed)
 */
export const isFieldCurrentlyAvailable = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): boolean => {
  const fieldLifecycle = getFieldLifecycle(lifecycles, typeName, fieldName)
  if (!fieldLifecycle) return false

  // Field is available if the most recent event is not a removal
  const mostRecentEvent = fieldLifecycle.events[0]
  if (!mostRecentEvent) return true

  return Match.value(mostRecentEvent).pipe(
    Match.tag('LifecycleEventRemoved', () => false),
    Match.orElse(() => true),
  )
}

/**
 * Get all types added on a specific date
 */
export const getTypesAddedOnDate = (lifecycles: Lifecycles, date: Date): string[] => {
  const dateString = date.toISOString().split('T')[0]
  const types: string[] = []

  for (const [typeName, typeLifecycle] of Object.entries(lifecycles.data)) {
    for (const event of typeLifecycle.events) {
      const isMatch = Match.value(event).pipe(
        Match.tag('LifecycleEventAdded', (e) => e.revision.date === dateString),
        Match.orElse(() => false),
      )
      if (isMatch) {
        types.push(typeName)
        break
      }
    }
  }

  return types
}

/**
 * Get all types removed on a specific date
 */
export const getTypesRemovedOnDate = (lifecycles: Lifecycles, date: Date): string[] => {
  const dateString = date.toISOString().split('T')[0]
  const types: string[] = []

  for (const [typeName, typeLifecycle] of Object.entries(lifecycles.data)) {
    for (const event of typeLifecycle.events) {
      const isMatch = Match.value(event).pipe(
        Match.tag('LifecycleEventRemoved', (e) => e.revision.date === dateString),
        Match.orElse(() => false),
      )
      if (isMatch) {
        types.push(typeName)
        break
      }
    }
  }

  return types
}

/**
 * Get lifecycle description for a type
 */
export const getTypeLifecycleDescription = (lifecycles: Lifecycles, typeName: string): string => {
  const typeLifecycle = lifecycles.data[typeName]
  if (!typeLifecycle) return 'Type not found'

  const addedDate = getTypeAddedDate(lifecycles, typeName)
  const removedDate = getTypeRemovedDate(lifecycles, typeName)

  if (removedDate) {
    return `Added on ${addedDate?.toISOString().split('T')[0]}, removed on ${removedDate.toISOString().split('T')[0]}`
  } else if (addedDate) {
    return `Added on ${addedDate.toISOString().split('T')[0]}`
  }

  return 'Unknown lifecycle'
}

/**
 * Get lifecycle description for a field
 */
export const getFieldLifecycleDescription = (
  lifecycles: Lifecycles,
  typeName: string,
  fieldName: string,
): string => {
  const fieldLifecycle = getFieldLifecycle(lifecycles, typeName, fieldName)
  if (!fieldLifecycle) return 'Field not found'

  const addedDate = getFieldAddedDate(lifecycles, typeName, fieldName)
  const removedDate = getFieldRemovedDate(lifecycles, typeName, fieldName)

  if (removedDate) {
    return `Added on ${addedDate?.toISOString().split('T')[0]}, removed on ${removedDate.toISOString().split('T')[0]}`
  } else if (addedDate) {
    return `Added on ${addedDate.toISOString().split('T')[0]}`
  }

  return 'Unknown lifecycle'
}

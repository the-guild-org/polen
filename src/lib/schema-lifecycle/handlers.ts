import type { GraphqlChange } from '#lib/graphql-change'
import type { GraphqlChangeset } from '#lib/graphql-changeset'
import type { NonEmptyArray } from '#lib/kit-temp'
import type { AddedEvent, RemovedEvent } from './LifecycleEvent.js'
import type { NamedTypeLifecycle, ObjectTypeLifecycle } from './NamedTypeLifecycle.js'
import { createSchemaLink } from './SchemaLink.js'

/**
 * Handler for type operations (TYPE_ADDED, TYPE_REMOVED, TYPE_KIND_CHANGED)
 */
export const TypeOperation = (
  data: Record<string, NamedTypeLifecycle>,
  change: GraphqlChange.Group.TypeOperation,
  date: Date,
  changeSet: GraphqlChangeset.ChangeSetData,
  schemaVersion: string | null,
) => {
  if (change.type === 'TYPE_ADDED') {
    const typeName = change.path || change.message || 'Unknown'
    if (!typeName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    // For now, default to object type
    // TODO: Determine actual type kind from change or schema
    const objectType: ObjectTypeLifecycle = {
      name: typeName,
      kind: 'object',
      events: [addedEvent],
      fields: {},
    }
    data[typeName] = objectType
  } else if (change.type === 'TYPE_REMOVED') {
    const typeName = change.path || change.message || 'Unknown'
    if (!typeName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    // Add removal event to existing type
    if (data[typeName]) {
      data[typeName].events = [removedEvent, ...data[typeName].events] as NonEmptyArray<any>
    }
  } else if (change.type === 'TYPE_KIND_CHANGED') {
    // TODO: Handle type kind changes
    // This would update the kind property of an existing type
  }
}

/**
 * Handler for field operations (FIELD_ADDED, FIELD_REMOVED, FIELD_TYPE_CHANGED)
 */
export const FieldOperation = (
  data: Record<string, NamedTypeLifecycle>,
  change: GraphqlChange.Group.FieldOperation,
  date: Date,
  changeSet: GraphqlChangeset.ChangeSetData,
  schemaVersion: string | null,
) => {
  if (change.type === 'FIELD_ADDED') {
    const { typeName, fieldName } = parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    // Ensure type exists
    if (!data[typeName]) {
      data[typeName] = createDefaultTypeLifecycle(typeName)
    }

    const typeLifecycle = data[typeName]

    // Add field to type if it supports fields
    if ('fields' in typeLifecycle) {
      typeLifecycle.fields[fieldName] = {
        name: fieldName,
        events: [addedEvent],
      }
    }
  } else if (change.type === 'FIELD_REMOVED') {
    const { typeName, fieldName } = parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    const typeLifecycle = data[typeName]
    if (typeLifecycle && 'fields' in typeLifecycle && typeLifecycle.fields[fieldName]) {
      typeLifecycle.fields[fieldName].events = [
        removedEvent,
        ...typeLifecycle.fields[fieldName].events,
      ] as NonEmptyArray<any>
    }
  } else if (change.type === 'FIELD_TYPE_CHANGED') {
    // TODO: Handle field type changes
    // This would add a type change event to the field's lifecycle
  }
}

/**
 * Handler for input field operations (INPUT_FIELD_ADDED, INPUT_FIELD_REMOVED, INPUT_FIELD_TYPE_CHANGED)
 */
export const InputFieldOperation = (
  data: Record<string, NamedTypeLifecycle>,
  change: GraphqlChange.Group.InputFieldOperation,
  date: Date,
  changeSet: GraphqlChangeset.ChangeSetData,
  schemaVersion: string | null,
) => {
  if (change.type === 'INPUT_FIELD_ADDED') {
    const { typeName, fieldName } = parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    // Ensure type exists
    if (!data[typeName]) {
      data[typeName] = createDefaultTypeLifecycle(typeName)
    }

    const typeLifecycle = data[typeName]

    // Add field to type if it supports fields
    if ('fields' in typeLifecycle) {
      typeLifecycle.fields[fieldName] = {
        name: fieldName,
        events: [addedEvent],
      }
    }
  } else if (change.type === 'INPUT_FIELD_REMOVED') {
    const { typeName, fieldName } = parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date,
      changeSet,
      schema: createSchemaLink(schemaVersion),
    }

    const typeLifecycle = data[typeName]
    if (typeLifecycle && 'fields' in typeLifecycle && typeLifecycle.fields[fieldName]) {
      typeLifecycle.fields[fieldName].events = [
        removedEvent,
        ...typeLifecycle.fields[fieldName].events,
      ] as NonEmptyArray<any>
    }
  } else if (change.type === 'INPUT_FIELD_TYPE_CHANGED') {
    // TODO: Handle input field type changes
  }
}

// Helper functions

/**
 * Parse field path like "User.email" into type and field names
 */
const parseFieldPath = (path?: string): { typeName: string | null; fieldName: string | null } => {
  if (!path) return { typeName: null, fieldName: null }

  const parts = path.split('.')
  if (parts.length >= 2) {
    return {
      typeName: parts[0] || null,
      fieldName: parts[1] || null,
    }
  }

  return { typeName: null, fieldName: null }
}

/**
 * Create default type lifecycle (fallback)
 */
const createDefaultTypeLifecycle = (typeName: string): NamedTypeLifecycle => {
  const defaultEvent: AddedEvent = {
    type: 'added',
    date: new Date('1970-01-01'),
    changeSet: null,
    schema: createSchemaLink(null),
  }

  const objectType: ObjectTypeLifecycle = {
    name: typeName,
    kind: 'object',
    events: [defaultEvent],
    fields: {},
  }
  return objectType
}

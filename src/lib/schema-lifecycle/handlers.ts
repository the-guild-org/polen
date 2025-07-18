import { Grafaid } from '#lib/grafaid'
import type { GraphqlChange } from '#lib/graphql-change'
import type { GraphqlChangeset } from '#lib/graphql-changeset'
import { GraphQLPath } from '#lib/graphql-path/$'
import type { NonEmptyArray } from '#lib/kit-temp'
import { isNamedType } from 'graphql'
import type { AddedEvent, RemovedEvent } from './LifecycleEvent.js'
import type { NamedTypeLifecycle } from './NamedTypeLifecycle.js'
import { createNamedTypeLifecycle } from './NamedTypeLifecycle.js'

/**
 * Create lifecycle entries for all types in an initial schema (treat as "create events")
 */
export const createInitialTypeLifecycles = (
  data: Record<string, NamedTypeLifecycle>,
  changeSet: GraphqlChangeset.InitialChangeSetLinked,
) => {
  const typeMap = changeSet.after.data.getTypeMap()
  
  for (const [typeName, graphqlType] of Object.entries(typeMap)) {
    // Skip built-in types that start with __
    if (typeName.startsWith('__')) continue
    
    if (!isNamedType(graphqlType)) continue
    
    const addedEvent: AddedEvent = {
      type: 'added',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
    }
    
    const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
    const typeLifecycle = createNamedTypeLifecycle(typeName, kind, addedEvent)
    data[typeName] = typeLifecycle
  }
}

/**
 * Handler for type operations (TYPE_ADDED, TYPE_REMOVED, TYPE_KIND_CHANGED)
 */
export const TypeOperation = (
  data: Record<string, NamedTypeLifecycle>,
  change: GraphqlChange.Group.TypeOperation,
  changeSet: GraphqlChangeset.IntermediateChangeSetLinked,
) => {
  if (change.type === 'TYPE_ADDED') {
    const typeName = change.path || change.message || 'Unknown'
    if (!typeName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
    }

    // Get actual type from schema to determine kind
    const graphqlType = changeSet.after.data.getType(typeName)
    if (!graphqlType || !isNamedType(graphqlType)) {
      throw new Error(`Type ${typeName} not found in schema`)
    }

    const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
    const typeLifecycle = createNamedTypeLifecycle(typeName, kind, addedEvent)
    data[typeName] = typeLifecycle
  } else if (change.type === 'TYPE_REMOVED') {
    const typeName = change.path || change.message || 'Unknown'
    if (!typeName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
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
  changeSet: GraphqlChangeset.IntermediateChangeSetLinked,
) => {
  if (change.type === 'FIELD_ADDED') {
    const { typeName, fieldName } = GraphQLPath.Definition.parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
    }

    // Ensure type exists - use schema to get real type
    if (!data[typeName]) {
      const graphqlType = changeSet.after.data.getType(typeName)
      if (!graphqlType || !isNamedType(graphqlType)) {
        throw new Error(`Type ${typeName} not found in schema`)
      }

      const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
      const typeEvent: AddedEvent = {
        type: 'added',
        date: new Date('1970-01-01'), // Unknown when type was added
        changeSet: null,
        schema: {
          version: null,
          data: null,
        },
      }
      data[typeName] = createNamedTypeLifecycle(typeName, kind, typeEvent)
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
    const { typeName, fieldName } = GraphQLPath.Definition.parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
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
  changeSet: GraphqlChangeset.IntermediateChangeSetLinked,
) => {
  if (change.type === 'INPUT_FIELD_ADDED') {
    const { typeName, fieldName } = GraphQLPath.Definition.parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const addedEvent: AddedEvent = {
      type: 'added',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
    }

    // Ensure type exists - use schema to get real type
    if (!data[typeName]) {
      const graphqlType = changeSet.after.data.getType(typeName)
      if (!graphqlType || !isNamedType(graphqlType)) {
        throw new Error(`Type ${typeName} not found in schema`)
      }

      const kind = Grafaid.Schema.typeKindFromClass(graphqlType)
      const typeEvent: AddedEvent = {
        type: 'added',
        date: new Date('1970-01-01'), // Unknown when type was added
        changeSet: null,
        schema: {
          version: null,
          data: null,
        },
      }
      data[typeName] = createNamedTypeLifecycle(typeName, kind, typeEvent)
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
    const { typeName, fieldName } = GraphQLPath.Definition.parseFieldPath(change.path)
    if (!typeName || !fieldName) return

    const removedEvent: RemovedEvent = {
      type: 'removed',
      date: changeSet.date,
      changeSet: changeSet,
      schema: changeSet.after,
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

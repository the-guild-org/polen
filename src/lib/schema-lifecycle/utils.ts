import { GraphQLPath } from '#lib/graphql-path'
import type { FieldLifecycle, InputFieldLifecycle } from './FieldLifecycle.js'
import type { AddedEvent, RemovedEvent } from './LifecycleEvent.js'
import type { NamedTypeLifecycle } from './NamedTypeLifecycle.js'
import type { SchemaLifecycle } from './SchemaLifecycle.js'

/**
 * Get lifecycle data for a specific type
 */
export const getTypeLifecycle = (
  lifecycle: SchemaLifecycle,
  typeName: string,
): NamedTypeLifecycle | null => {
  return lifecycle.data[typeName] || null
}

/**
 * Get lifecycle data for a specific field
 */
export const getFieldLifecycle = (
  lifecycle: SchemaLifecycle,
  path: GraphQLPath.FieldDefinitionPath,
): FieldLifecycle | InputFieldLifecycle | null => {
  const typeName = GraphQLPath.Definition.getType(path)
  const fieldName = GraphQLPath.Definition.getField(path)

  const typeLifecycle = getTypeLifecycle(lifecycle, typeName)
  if (!typeLifecycle) return null

  if ('fields' in typeLifecycle) {
    return typeLifecycle.fields[fieldName] || null
  }

  return null
}

/**
 * Check if a type is currently available (not removed)
 */
export const isTypeCurrentlyAvailable = (
  lifecycle: SchemaLifecycle,
  typeName: string,
): boolean => {
  const typeLifecycle = getTypeLifecycle(lifecycle, typeName)
  if (!typeLifecycle) return false

  const mostRecentEvent = typeLifecycle.events[0]
  return (mostRecentEvent as AddedEvent | RemovedEvent).type === 'added'
}

/**
 * Check if a field is currently available (not removed)
 */
export const isFieldCurrentlyAvailable = (
  lifecycle: SchemaLifecycle,
  path: GraphQLPath.FieldDefinitionPath,
): boolean => {
  const fieldLifecycle = getFieldLifecycle(lifecycle, path)
  if (!fieldLifecycle) return false

  const mostRecentEvent = fieldLifecycle.events[0]
  return (mostRecentEvent as AddedEvent | RemovedEvent).type === 'added'
}

/**
 * Get the date when a type was first added
 */
export const getTypeAddedDate = (
  lifecycle: SchemaLifecycle,
  typeName: string,
): Date | null => {
  const typeLifecycle = getTypeLifecycle(lifecycle, typeName)
  if (!typeLifecycle) return null

  // Find the first (oldest) added event
  const addedEvents = typeLifecycle.events.filter(
    (event): event is AddedEvent => (event as AddedEvent | RemovedEvent).type === 'added',
  )

  if (addedEvents.length === 0) return null

  // Events are in reverse chronological order, so last item is oldest
  return addedEvents[addedEvents.length - 1]?.date || null
}

/**
 * Get the date when a type was most recently removed (if any)
 */
export const getTypeRemovedDate = (
  lifecycle: SchemaLifecycle,
  typeName: string,
): Date | null => {
  const typeLifecycle = getTypeLifecycle(lifecycle, typeName)
  if (!typeLifecycle) return null

  // Find the most recent removed event
  const removedEvent = typeLifecycle.events.find(
    (event): event is RemovedEvent => (event as AddedEvent | RemovedEvent).type === 'removed',
  )

  return removedEvent?.date || null
}

/**
 * Get the date when a field was first added
 */
export const getFieldAddedDate = (
  lifecycle: SchemaLifecycle,
  path: GraphQLPath.FieldDefinitionPath,
): Date | null => {
  const fieldLifecycle = getFieldLifecycle(lifecycle, path)
  if (!fieldLifecycle) return null

  // Find the first (oldest) added event
  const addedEvents = fieldLifecycle.events.filter(
    (event): event is AddedEvent => (event as AddedEvent | RemovedEvent).type === 'added',
  )

  if (addedEvents.length === 0) return null

  // Events are in reverse chronological order, so last item is oldest
  return addedEvents[addedEvents.length - 1]?.date || null
}

/**
 * Get the date when a field was most recently removed (if any)
 */
export const getFieldRemovedDate = (
  lifecycle: SchemaLifecycle,
  path: GraphQLPath.FieldDefinitionPath,
): Date | null => {
  const fieldLifecycle = getFieldLifecycle(lifecycle, path)
  if (!fieldLifecycle) return null

  // Find the most recent removed event
  const removedEvent = fieldLifecycle.events.find(
    (event): event is RemovedEvent => (event as AddedEvent | RemovedEvent).type === 'removed',
  )

  return removedEvent?.date || null
}

/**
 * Get all types that were added on a specific date
 */
export const getTypesAddedOnDate = (
  lifecycle: SchemaLifecycle,
  date: Date,
): string[] => {
  const result: string[] = []

  for (const [typeName, typeLifecycle] of Object.entries(lifecycle.data)) {
    const addedOnDate = typeLifecycle.events.some(
      event => (event as AddedEvent | RemovedEvent).type === 'added' && event.date.getTime() === date.getTime(),
    )

    if (addedOnDate) {
      result.push(typeName)
    }
  }

  return result
}

/**
 * Get all types that were removed on a specific date
 */
export const getTypesRemovedOnDate = (
  lifecycle: SchemaLifecycle,
  date: Date,
): string[] => {
  const result: string[] = []

  for (const [typeName, typeLifecycle] of Object.entries(lifecycle.data)) {
    const removedOnDate = typeLifecycle.events.some(
      event => (event as AddedEvent | RemovedEvent).type === 'removed' && event.date.getTime() === date.getTime(),
    )

    if (removedOnDate) {
      result.push(typeName)
    }
  }

  return result
}

/**
 * Get a human-readable description of a type's lifecycle status
 */
export const getTypeLifecycleDescription = (
  lifecycle: SchemaLifecycle,
  typeName: string,
): string => {
  const typeLifecycle = getTypeLifecycle(lifecycle, typeName)
  if (!typeLifecycle) return `Type "${typeName}" not found`

  const isAvailable = isTypeCurrentlyAvailable(lifecycle, typeName)
  const addedDate = getTypeAddedDate(lifecycle, typeName)
  const removedDate = getTypeRemovedDate(lifecycle, typeName)

  if (isAvailable) {
    return `Available since ${addedDate?.toISOString().split('T')[0] || 'unknown'}`
  } else if (removedDate) {
    return `Removed on ${removedDate.toISOString().split('T')[0]}`
  } else {
    return 'Status unknown'
  }
}

/**
 * Get a human-readable description of a field's lifecycle status
 */
export const getFieldLifecycleDescription = (
  lifecycle: SchemaLifecycle,
  path: GraphQLPath.FieldDefinitionPath,
): string => {
  const typeName = GraphQLPath.Definition.getType(path)
  const fieldName = GraphQLPath.Definition.getField(path)

  const fieldLifecycle = getFieldLifecycle(lifecycle, path)
  if (!fieldLifecycle) return `Field "${typeName}.${fieldName}" not found`

  const isAvailable = isFieldCurrentlyAvailable(lifecycle, path)
  const addedDate = getFieldAddedDate(lifecycle, path)
  const removedDate = getFieldRemovedDate(lifecycle, path)

  if (isAvailable) {
    return `Available since ${addedDate?.toISOString().split('T')[0] || 'unknown'}`
  } else if (removedDate) {
    return `Removed on ${removedDate.toISOString().split('T')[0]}`
  } else {
    return 'Status unknown'
  }
}

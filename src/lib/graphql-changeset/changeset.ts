import type { GrafaidOld } from '#lib/grafaid-old'
import type { GraphqlChange } from '#lib/graphql-change'
import type { GraphQLSchema } from 'graphql'
import { SuperJSON } from 'superjson'
import type { VersionableSchema, VersionableSchemaLinked } from './versioned-schema.js'

const superjson = new SuperJSON()

superjson.registerCustom({
  isApplicable: (v): v is GraphQLSchema => v?.constructor?.name === 'GraphQLSchema',
  serialize: () => null,
  deserialize: () => null,
}, 'GraphQLSchema')

// ChangeSet

export type ChangeSet = IntermediateChangeSet | InitialChangeSet

export interface IntermediateChangeSet {
  type: 'IntermediateChangeSet'
  changes: GraphqlChange.Change[]
  date: Date
  after: VersionableSchema
  before: VersionableSchema
}

export interface InitialChangeSet {
  type: 'InitialChangeSet'
  date: Date
  after: VersionableSchema
}

// Linked

export type ChangeSetLinked = InitialChangeSetLinked | IntermediateChangeSetLinked

export interface IntermediateChangeSetLinked extends IntermediateChangeSet {
  after: VersionableSchemaLinked
  before: VersionableSchemaLinked
}

export interface InitialChangeSetLinked extends InitialChangeSet {
  after: VersionableSchemaLinked
}

// Predicate Functions

/**
 * Type guard to check if a value is any type of ChangeSet
 */
export const isChangeSet = (value: unknown): value is ChangeSet => {
  return value !== null
    && typeof value === 'object'
    && 'type' in value
    && ((value as any).type === 'InitialChangeSet' || (value as any).type === 'IntermediateChangeSet')
}

/**
 * Type guard to check if a changeset is an InitialChangeSet
 */
export const isInitialChangeSet = (changeSet: ChangeSet): changeSet is InitialChangeSet => {
  return changeSet.type === 'InitialChangeSet'
}

/**
 * Type guard to check if a changeset is an IntermediateChangeSet
 */
export const isIntermediateChangeSet = (changeSet: ChangeSet): changeSet is IntermediateChangeSet => {
  return changeSet.type === 'IntermediateChangeSet'
}

/**
 * Type guard to check if a linked changeset is an InitialChangeSetLinked
 */
export const isInitialChangeSetLinked = (changeSet: ChangeSetLinked): changeSet is InitialChangeSetLinked => {
  return changeSet.type === 'InitialChangeSet'
}

/**
 * Type guard to check if a linked changeset is an IntermediateChangeSetLinked
 */
export const isIntermediateChangeSetLinked = (changeSet: ChangeSetLinked): changeSet is IntermediateChangeSetLinked => {
  return changeSet.type === 'IntermediateChangeSet'
}

/**
 * Type guard to check if a changeset is linked (has schema data)
 */
export const isLinked = (changeSet: ChangeSet | ChangeSetLinked): changeSet is ChangeSetLinked => {
  if (isInitialChangeSet(changeSet)) {
    return changeSet.after.data !== null
  } else {
    return changeSet.after.data !== null && changeSet.before.data !== null
  }
}

// JSON Codecs

/**
 * Convert an unlinked changeset to linked by adding schema references
 */
export const link = (
  changeset: ChangeSet,
  schemaResolver: (version: string | null) => GrafaidOld.Schema.Schema | null,
): ChangeSetLinked => {
  if (isInitialChangeSet(changeset)) {
    const afterSchema = schemaResolver(changeset.after.version)
    if (!afterSchema) {
      throw new Error(`Unable to resolve schema for version: ${changeset.after.version}`)
    }
    return {
      type: 'InitialChangeSet',
      date: changeset.date,
      after: {
        version: changeset.after.version,
        data: afterSchema,
      },
    }
  } else {
    const afterSchema = schemaResolver(changeset.after.version)
    const beforeSchema = schemaResolver(changeset.before.version)
    if (!afterSchema || !beforeSchema) {
      throw new Error(
        `Unable to resolve schemas for versions: after=${changeset.after.version}, before=${changeset.before.version}`,
      )
    }
    return {
      type: 'IntermediateChangeSet',
      changes: changeset.changes,
      date: changeset.date,
      after: {
        version: changeset.after.version,
        data: afterSchema,
      },
      before: {
        version: changeset.before.version,
        data: beforeSchema,
      },
    }
  }
}

/**
 * Convert a linked changeset to unlinked by removing schema references
 */
// export const unlink = (changeset: ChangeSetLinked): ChangeSet => {
//   if (isInitialChangeSetLinked(changeset)) {
//     return {
//       type: 'InitialChangeSet',
//       date: changeset.date,
//       after: {
//         version: changeset.after.version,
//         data: null,
//       },
//     }
//   } else {
//     return {
//       type: 'IntermediateChangeSet',
//       changes: changeset.changes,
//       date: changeset.date,
//       after: {
//         version: changeset.after.version,
//         data: null,
//       },
//       before: {
//         version: changeset.before.version,
//         data: null,
//       },
//     }
//   }
// }

/**
 * Convert a changeset to JSON string (handles both linked and unlinked)
 */
export const toJson = (changeset: ChangeSet, options?: { pretty?: boolean }): string => {
  const isPretty = options?.pretty ?? true
  if (isPretty) {
    const serialized = superjson.serialize(changeset)
    return JSON.stringify(serialized, null, 2)
  }
  return superjson.stringify(changeset)
}

/**
 * Parse changeset from JSON string
 */
export const fromJson = (json: string): ChangeSet => {
  return superjson.parse(json)
}

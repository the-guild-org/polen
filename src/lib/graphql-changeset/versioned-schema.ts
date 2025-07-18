import type { GrafaidOld } from '#lib/grafaid-old'

// VersionableSchema

export interface VersionableSchema {
  /**
   * `null` if schema is not versioned.
   */
  version: string | null
  /**
   * `null` if schema has not been hydrated.
   * Something external is resonsible for linking this.
   * It should use `version` if not null to get the correct schema somehow.
   * If `version` is null, it should use some schema singleton.
   */
  data: GrafaidOld.Schema.Schema | null
}

export interface VersionableSchemaUnlinked {
  version: string | null
  data: null
}

export interface VersionableSchemaLinked {
  version: string | null
  data: GrafaidOld.Schema.Schema
}

// Predicate Functions

/**
 * Type guard to check if a schema is linked (has data)
 */
export const isVersionableSchemaLinked = (schema: VersionableSchema): schema is VersionableSchemaLinked => {
  return schema.data !== null
}

/**
 * Type guard to check if a schema is unlinked (no data)
 */
export const isVersionableSchemaUnlinked = (schema: VersionableSchema): schema is VersionableSchemaUnlinked => {
  return schema.data === null
}

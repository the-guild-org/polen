import type { Schema } from 'effect'
import type React from 'react'
import type { RouteObject } from 'react-router'

/**
 * Global registry of route schemas that can be augmented by route definitions.
 * This enables type-safe access to route data by ID.
 */
export interface RouteSchemaRegistry {
  // Routes will augment this interface
}

/**
 * Get the schema type from the registry for a given route ID.
 */
export type GetRouteSchema<TRouteId extends keyof RouteSchemaRegistry> = RouteSchemaRegistry[TRouteId]

/**
 * Handle interface for routes with Effect schemas attached.
 */
export interface SchemaRouteHandle<TSchema extends Schema.Schema.Any = Schema.Schema.Any> {
  /**
   * The Effect schema for this route's loader data.
   */
  schema: TSchema
  /**
   * Optional schema ID for registry lookups.
   */
  schemaId?: string | undefined
}

/**
 * Route object with an attached Effect schema.
 */
export type SchemaRoute<TSchema extends Schema.Schema.Any = Schema.Schema.Any> = RouteObject & {
  handle: SchemaRouteHandle<TSchema>
  loader?: RouteObject['loader']
}

/**
 * Configuration for creating a schema-aware route.
 */
export interface SchemaRouteConfig<TSchema extends Schema.Schema.Any> {
  /**
   * The Effect schema for validating and encoding/decoding loader data.
   */
  schema: TSchema
  /**
   * The loader function that returns data matching the schema type.
   * The returned data will be automatically encoded using the schema.
   */
  loader?: (args: any) => Promise<Schema.Schema.Type<TSchema>>
  /**
   * Additional handle properties beyond the schema.
   */
  handle?: Omit<SchemaRouteHandle<TSchema>, 'schema'>

  // Route properties
  id?: string
  path?: string
  index?: boolean
  children?: RouteObject[]
  Component?: React.ComponentType<any>
  element?: React.ReactNode
  errorElement?: React.ReactNode
}

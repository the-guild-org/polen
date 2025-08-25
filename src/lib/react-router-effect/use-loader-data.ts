import { Schema } from 'effect'
import { useLoaderData as useLoaderDataRR, useMatches } from 'react-router'
import type { GetRouteSchema, RouteSchemaRegistry } from './types.js'

/**
 * Hook that retrieves and automatically decodes loader data based on a provided Effect schema.
 * This can access data from any route in the hierarchy that has the matching schema.
 *
 * @example
 * ```typescript
 * function CatalogView() {
 *   // Get current route's catalog data
 *   const catalog = useLoaderData(CatalogSchema)
 *
 *   // Get ancestor route's user data
 *   const user = useLoaderData(UserSchema)
 *
 *   return <div>{user.name}'s {catalog.name}</div>
 * }
 * ```
 */
export function useLoaderData<TSchema extends Schema.Schema.Any>(
  schema: TSchema,
): Schema.Schema.Type<TSchema> {
  const matches = useMatches()

  // Find the match that has this exact schema attached
  const match = matches.find(m => (m.handle as any)?.schema === schema)

  if (!match) {
    throw new Error(
      `No route found with the specified schema. Make sure the route uses schemaRoute() or has the schema in its handle.`,
    )
  }

  if (match.data === undefined) {
    throw new Error(
      `No loader data found for route ${match.id}. Make sure the route has a loader.`,
    )
  }

  // Decode the data using the schema
  return Schema.decodeUnknownSync(schema as any)(match.data) as Schema.Schema.Type<TSchema>
}

/**
 * Hook that retrieves loader data by route ID with type safety from the RouteSchemaRegistry.
 * Routes must augment the registry interface for this to work.
 *
 * @example
 * ```typescript
 * // In route file:
 * declare module '#lib/react-router-effect/types' {
 *   interface RouteSchemaRegistry {
 *     'catalog': typeof CatalogSchema
 *   }
 * }
 *
 * // In component:
 * const catalog = useRouteDataById('catalog') // Type-safe!
 * ```
 */
export function useRouteDataById<TRouteId extends keyof RouteSchemaRegistry>(
  routeId: TRouteId,
): Schema.Schema.Type<GetRouteSchema<TRouteId>> {
  const matches = useMatches()
  const match = matches.find(m => m.id === routeId)

  if (!match) {
    throw new Error(`No route found with ID "${String(routeId)}"`)
  }

  if (!(match.handle as any)?.schema) {
    throw new Error(
      `Route "${String(routeId)}" does not have a schema attached. Use schemaRoute() to create the route.`,
    )
  }

  if (match.data === undefined) {
    throw new Error(
      `No loader data found for route "${String(routeId)}". Make sure the route has a loader.`,
    )
  }

  return Schema.decodeUnknownSync((match.handle as any).schema)(match.data) as any
}

/**
 * Hook that returns all route data from the current route hierarchy, decoded using their schemas.
 * Returns an object keyed by route ID.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const routeData = useRouteData()
 *   // Access any route's data by ID
 *   const user = routeData.user
 *   const catalog = routeData.catalog
 * }
 * ```
 */
export function useRouteData(): Record<string, unknown> {
  const matches = useMatches()

  return matches.reduce((acc, match) => {
    // Only process matches that have both a schema and data
    if ((match.handle as any)?.schema && match.data !== undefined && match.id) {
      try {
        const decoded = Schema.decodeUnknownSync((match.handle as any).schema as any)(match.data)
        acc[match.id] = decoded
      } catch (error) {
        // Log decode errors but don't throw to allow partial data access
        
      }
    }
    return acc
  }, {} as Record<string, unknown>)
}

/**
 * Original useLoaderData behavior - returns loader data for current route without schema decoding.
 * Provided for backward compatibility.
 */
export function useLoaderDataRaw<T = unknown>(routeId?: string): T {
  const loaderData = routeId
    ? (useLoaderDataRR as any)(routeId)
    : useLoaderDataRR()

  if (loaderData === undefined) {
    throw new Error(`No loader data returned from route ${routeId ?? '<current>'}`)
  }

  return loaderData as T
}

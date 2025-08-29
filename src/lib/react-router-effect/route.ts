import type { ReactRouter } from '#dep/react-router/index'
import { Effect, Schema } from 'effect'
import type { IsNever } from 'type-fest'
import type { SchemaRoute, SchemaRouteConfig } from './types.js'

/**
 * Creates a route with an optional Effect schema for automatic encoding/decoding.
 *
 * @example
 * ```typescript
 * // With schema
 * export const catalogRoute = route({
 *   id: 'catalog',
 *   path: '/catalog/:id',
 *   schema: CatalogSchema,
 *   loader: async ({ params }) => {
 *     // Return decoded data - it will be automatically encoded
 *     return await fetchCatalog(params.id)
 *   },
 *   Component: CatalogView,
 * })
 *
 * // Without schema
 * export const pages = route({
 *   Component: PagesLayout,
 *   children: [...routes],
 * })
 * ```
 */
export const route = <TSchema extends Schema.Schema.Any = never>(
  config: IsNever<TSchema> extends true ? ReactRouter.RouteObject
    : SchemaRouteConfig<TSchema>,
): TSchema extends never ? ReactRouter.RouteObject : SchemaRoute<TSchema> => {
  const { schema, loader, handle, ...routeConfig } = config as any

  // If no schema provided, return a regular route
  if (!schema) {
    return {
      ...routeConfig,
      handle,
      loader,
    } as any
  }

  // Schema provided - add schema handling
  const route: any = {
    ...routeConfig,
    handle: {
      ...handle,
      schema,
      schemaId: routeConfig.id || undefined,
    },
  }

  if (loader) {
    route.loader = async (args: any) => {
      // Call the loader function
      const result = loader(args)

      // Check if result is an Effect or a Promise
      let decodedData: any
      if (Effect.isEffect(result)) {
        // It's an Effect, run it
        decodedData = await Effect.runPromise(result as any)
      } else {
        // It's a Promise, await it
        decodedData = await result
      }

      // Encode the data for transport using the schema
      const encodedData = Schema.encodeSync(schema as any)(decodedData as any)

      return encodedData
    }
  }

  return route as any
}

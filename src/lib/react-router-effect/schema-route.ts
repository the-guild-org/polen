import { Effect, Schema } from 'effect'
import type { SchemaRoute, SchemaRouteConfig } from './types.js'

/**
 * Creates a route with an attached Effect schema for automatic encoding/decoding.
 *
 * @example
 * ```typescript
 * export const catalogRoute = schemaRoute({
 *   id: 'catalog',
 *   path: '/catalog/:id',
 *   schema: CatalogSchema,
 *   loader: async ({ params }) => {
 *     // Return decoded data - it will be automatically encoded
 *     return await fetchCatalog(params.id)
 *   },
 *   Component: CatalogView,
 * })
 * ```
 */
export const schemaRoute = <TSchema extends Schema.Schema.Any>(
  config: SchemaRouteConfig<TSchema>,
): SchemaRoute<TSchema> => {
  const { schema, loader, handle, ...routeConfig } = config

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
      // Convert Promise to Effect for internal consistency
      const loaderEffect = Effect.tryPromise(() => loader(args))
      const decodedData = await Effect.runPromise(loaderEffect)

      // Encode the data for transport using the schema
      const encodedData = Schema.encodeSync(schema as any)(decodedData as any)

      return encodedData
    }
  }

  return route as SchemaRoute<TSchema>
}

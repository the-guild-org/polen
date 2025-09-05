import type { ReactRouter } from '#dep/react-router/index'
import type { React } from '#dep/react/index'
import { Effect, Schema } from 'effect'
import type { IsNever } from 'type-fest'
import type { SchemaRoute, SchemaRouteConfig } from './types.js'

export type RouteObjectIndexInput = RouteObjectIndexInputConfig | React.ComponentType
export type RouteObjectIndexInputConfig = Omit<ReactRouter.IndexRouteObject, 'index' | 'children'>

export type SchemaRouteIndexConfig<TSchema extends Schema.Schema.Any> =
  & Omit<SchemaRouteConfig<TSchema>, 'index' | 'children' | 'path'>
  & {
    index?: true
  }

/**
 * Helper to create an index route configuration with optional schema support
 * @param input - Either a component or a route configuration object (optionally with schema)
 * @returns An index route object
 */
export function routeIndex<TSchema extends Schema.Schema.Any = never>(
  input: IsNever<TSchema> extends true ? RouteObjectIndexInput
    : SchemaRouteIndexConfig<TSchema> | React.ComponentType,
): TSchema extends never ? ReactRouter.IndexRouteObject : SchemaRoute<TSchema> {
  const routeConfig: any = isComponentType(input) ? { Component: input } : input
  const { schema, loader, handle, ...restConfig } = routeConfig

  // Determine route ID for index routes
  let routeId: string | undefined = undefined
  if (typeof restConfig.id === 'string') {
    routeId = restConfig.id
  } else if (restConfig.id === true) {
    routeId = '@index'
  }

  // If no schema provided, return a regular index route
  if (!schema) {
    return {
      ...restConfig,
      ...(routeId && { id: routeId }),
      handle,
      loader,
      index: true,
      children: undefined,
    } as any
  }

  // Schema provided - add schema handling
  const route: any = {
    ...restConfig,
    ...(routeId && { id: routeId }),
    index: true,
    children: undefined,
    handle: {
      ...handle,
      schema,
      schemaId: routeId,
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

const isComponentType = (value: unknown): value is React.ComponentType => {
  return typeof value === 'function'
}

import { Schema } from 'effect'
import type { LoaderFunction } from 'react-router'

/**
 * Creates a loader function that automatically encodes the returned data using an Effect schema.
 * This ensures that complex types (Date, BigInt, custom classes) are properly serialized
 * for transport between server and client.
 *
 * @example
 * ```typescript
 * export const loader = createEffectLoader(
 *   UserSchema,
 *   async ({ params }) => {
 *     const user = await fetchUser(params.id)
 *     return user // Will be automatically encoded
 *   }
 * )
 * ```
 */
export const createEffectLoader = <TSchema extends Schema.Schema.Any = Schema.Schema.Any>(
  schema: TSchema,
  loader: (args: Parameters<LoaderFunction>[0]) => Promise<Schema.Schema.Type<TSchema>>,
): LoaderFunction => {
  return async (args) => {
    // Execute the loader to get decoded data
    const decodedData = await loader(args)

    // Encode the data for transport using the schema
    const encodedData = Schema.encodeSync(schema as any)(decodedData as any)

    return encodedData
  }
}

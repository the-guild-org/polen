// import { Effect, Schema } from 'effect'
// import type { LoaderFunction } from 'react-router'

// /**
//  * Creates a React Router loader from a function that returns an Effect.
//  * The Effect will be run and the result will be encoded using the provided schema.
//  *
//  * @example
//  * ```typescript
//  * const loader = createEffectLoaderFromEffect(
//  *   UserSchema,
//  *   ({ params }) => Effect.gen(function* () {
//  *     const service = yield* UserService
//  *     return yield* service.getUser(params.id)
//  *   })
//  * )
//  * ```
//  */
// export const createEffectLoaderFromEffect = <TSchema extends Schema.Schema.Any = Schema.Schema.Any>(
//   schema: TSchema,
//   loader: (args: Parameters<LoaderFunction>[0]) => Effect.Effect<Schema.Schema.Type<TSchema>, any, any>,
// ): LoaderFunction => {
//   return async (args) => {
//     const decodedData = await Effect.runPromise(loader(args))
//     const encodedData = Schema.encodeSync(schema as any)(decodedData as any)
//     return encodedData
//   }
// }

// /**
//  * Creates a loader function that automatically encodes the returned data using an Effect schema.
//  * This ensures that complex types (Date, BigInt, custom classes) are properly serialized
//  * for transport between server and client.
//  *
//  * @example
//  * ```typescript
//  * export const loader = createEffectLoader(
//  *   UserSchema,
//  *   async ({ params }) => {
//  *     const user = await fetchUser(params.id)
//  *     return user // Will be automatically encoded
//  *   }
//  * )
//  * ```
//  */
// export const createEffectLoaderFromPromise = <TSchema extends Schema.Schema.Any = Schema.Schema.Any>(
//   schema: TSchema,
//   loader: (args: Parameters<LoaderFunction>[0]) => Promise<Schema.Schema.Type<TSchema>>,
// ): LoaderFunction => {
//   return async (args) => {
//     // Convert Promise to Effect for internal consistency
//     const loaderEffect = Effect.tryPromise(() => loader(args))
//     const decodedData = await Effect.runPromise(loaderEffect)
//     const encodedData = Schema.encodeSync(schema as any)(decodedData as any)
//     return encodedData
//   }
// }

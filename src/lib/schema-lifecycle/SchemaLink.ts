// import type { GraphQLSchema } from 'graphql'

// /**
//  * Schema link for versioned schemas
//  */
// export interface VersionedSchemaLink {
//   type: 'versioned'
//   version: string
//   data: GraphQLSchema | null
// }

// /**
//  * Schema link for unversioned/global schemas
//  */
// export interface UnversionedSchemaLink {
//   type: 'unversioned'
//   data: GraphQLSchema | null
// }

// /**
//  * Schema link can be either versioned or unversioned
//  */
// export type SchemaLink = VersionedSchemaLink | UnversionedSchemaLink

// /**
//  * Create a schema link based on version
//  */
// export const createSchemaLink = (version: string | null): SchemaLink => {
//   if (version === null) {
//     return {
//       type: 'unversioned',
//       data: null,
//     }
//   }
//   return {
//     type: 'versioned',
//     version,
//     data: null,
//   }
// }

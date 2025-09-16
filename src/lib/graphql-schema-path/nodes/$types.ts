import type { S } from '#lib/kit-temp'
import * as Groups from './$groups.js'
import * as Argument from './argument.js'
import * as Field from './field.js'
import * as ResolvedType from './resolved-type.js'
import * as Root from './root.js'
import * as Type from './type.js'

// ============================================================================
// Groups
// ============================================================================

export type GetChildren<$Node extends Groups.$Any> = NonNullable<$Node['next']>

export type GetChildrenTags<$Node extends Groups.$Any> = GetChildren<$Node>['_tag']

// ============================================================================
// Low Level Types
// ============================================================================

export type Tag = keyof ModuleIndex

export type SomeSchema = S.TaggedStruct<any, any>

export type SomeFunction = (...args: any[]) => any

export interface $NodeModule {
  Schema: SomeSchema
  make: SomeFunction
}

export interface Index {
  GraphQLPathRoot: Root.Root
  GraphQLPathSegmentType: Type.Type
  GraphQLPathSegmentField: Field.Field
  GraphQLPathSegmentArgument: Argument.Argument
  GraphQLPathSegmentResolvedType: ResolvedType.ResolvedType
}

// ============================================================================
// Parents Index
// ============================================================================

/**
 * Map of which nodes can be parents of each child node.
 * For each child tag, get the union of parent nodes that have it in their next.
 */
export type ParentsIndex = {
  [$Tag in Tag]: {
    [$ParentTag in Tag]: $Tag extends GetChildrenTags<Index[$ParentTag]> ? Index[$ParentTag]
      : never
  }[Tag]
}

/**
 * Get all parent nodes that can have the given child tag.
 */
export type GetParents<$Tag extends Tag> = ParentsIndex[$Tag]

/**
 * Get all parent tags that can have the given child tag.
 */
export type GetParentTags<$Tag extends Tag> = GetParents<$Tag>['_tag']

// ============================================================================
// Modules Index
// ============================================================================

export type Modules = ModuleIndex[keyof ModuleIndex]

export interface ModuleIndex {
  GraphQLPathRoot: typeof Root
  GraphQLPathSegmentType: typeof Type
  GraphQLPathSegmentField: typeof Field
  GraphQLPathSegmentArgument: typeof Argument
  GraphQLPathSegmentResolvedType: typeof ResolvedType
}

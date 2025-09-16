/**
 * GraphQL kinds - fundamental taxonomy of GraphQL schema elements.
 */

// ============================================================================
// Node Kinds
// ============================================================================

/**
 * Node kinds - elements that can contain other elements or exist within the schema structure.
 */
export const Node = {
  Schema: 'Schema',
  Field: 'Field',
  Argument: 'Argument',
  Directive: 'Directive',
  InputField: 'InputField',
  EnumValue: 'EnumValue',
} as const

export type Node = typeof Node[keyof typeof Node]

// ============================================================================
// Type Kinds
// ============================================================================

/**
 * Type kinds - the named types in a GraphQL schema.
 */
export const Type = {
  Object: 'Object',
  Interface: 'Interface',
  Union: 'Union',
  Scalar: 'Scalar',
  Enum: 'Enum',
  InputObject: 'InputObject',
} as const

export type Type = typeof Type[keyof typeof Type]

// ============================================================================
// All Kinds
// ============================================================================

/**
 * All GraphQL kinds combined.
 */
export const Kinds = {
  ...Node,
  ...Type,
} as const

export type Kind = Node | Type

// ============================================================================
// Kind Groups (Like)
// ============================================================================

/**
 * Groups of kinds that share common characteristics.
 * These are useful for validation and type guards.
 */
export const Like = {
  /**
   * All named types in GraphQL.
   */
  Named: [Type.Object, Type.Interface, Type.Union, Type.Scalar, Type.Enum, Type.InputObject] as const,

  /**
   * Types that can have fields.
   */
  Fielded: [Type.Object, Type.Interface] as const,

  /**
   * Types that can have arguments (fields and directives).
   */
  Argable: [Node.Field, Node.Directive] as const,

  /**
   * Types that are output types (can be used as field return types).
   */
  Output: [Type.Object, Type.Interface, Type.Union, Type.Scalar, Type.Enum] as const,

  /**
   * Types that are input types (can be used as argument types).
   */
  Input: [Type.Scalar, Type.Enum, Type.InputObject] as const,

  /**
   * Types that are abstract (need concrete implementations).
   */
  Abstract: [Type.Interface, Type.Union] as const,

  /**
   * Types that are concrete (can be instantiated).
   */
  Concrete: [Type.Object, Type.Scalar, Type.Enum, Type.InputObject] as const,
} as const

export type Like = typeof Like
export type LikeNamed = typeof Like.Named[number]
export type LikeFielded = typeof Like.Fielded[number]
export type LikeArgable = typeof Like.Argable[number]
export type LikeOutput = typeof Like.Output[number]
export type LikeInput = typeof Like.Input[number]
export type LikeAbstract = typeof Like.Abstract[number]
export type LikeConcrete = typeof Like.Concrete[number]

// ============================================================================
// Parent Kind Mapping (Type-Level)
// ============================================================================

/**
 * Type-level mapping of what kinds can be parents of other kinds.
 * This encodes the fundamental containment rules of GraphQL.
 */
export interface ParentKindMap {
  // Node kinds
  Field: 'Object' | 'Interface'
  Argument: 'Field' | 'Directive'
  InputField: 'InputObject'
  EnumValue: 'Enum'
  // Type kinds (all types exist at schema root)
  Object: 'Schema'
  Interface: 'Schema'
  Union: 'Schema'
  Scalar: 'Schema'
  Enum: 'Schema'
  InputObject: 'Schema'
}

/**
 * Type helper to get valid parent kinds for a child kind.
 */
export type ParentKindsOf<K extends keyof ParentKindMap> = ParentKindMap[K]

// ============================================================================
// Parent Kind Mapping (Runtime)
// ============================================================================

/**
 * Runtime mapping of valid parent kinds for each kind.
 * Uses const assertion with satisfies to ensure type safety.
 */
export const ParentKinds = {
  // Node kinds
  Field: ['Object', 'Interface'],
  Argument: ['Field', 'Directive'],
  InputField: ['InputObject'],
  EnumValue: ['Enum'],
  // Type kinds
  Object: ['Schema'],
  Interface: ['Schema'],
  Union: ['Schema'],
  Scalar: ['Schema'],
  Enum: ['Schema'],
  InputObject: ['Schema'],
} as const satisfies {
  [K in keyof ParentKindMap]: readonly ParentKindMap[K][]
}

/**
 * Get valid parent kinds for a child kind.
 * Strongly typed overloads provide compile-time safety when the kind is known.
 */
export function getParentKinds<K extends keyof ParentKindMap>(
  childKind: K,
): typeof ParentKinds[K]
export function getParentKinds(
  childKind: string,
): readonly string[] | undefined
export function getParentKinds(
  childKind: string,
): readonly string[] | undefined {
  return ParentKinds[childKind as keyof typeof ParentKinds]
}

// ============================================================================
// Child Kind Mapping (Type-Level)
// ============================================================================

/**
 * Type-level mapping of what kinds can contain other kinds.
 * The inverse of ParentKindMap.
 */
export interface ChildKindMap {
  Schema: 'Object' | 'Interface' | 'Union' | 'Scalar' | 'Enum' | 'InputObject'
  Object: 'Field'
  Interface: 'Field'
  Field: 'Argument'
  Directive: 'Argument'
  InputObject: 'InputField'
  Enum: 'EnumValue'
}

export type ChildKindsOf<K extends keyof ChildKindMap> = ChildKindMap[K]

// ============================================================================
// Child Kind Mapping (Runtime)
// ============================================================================

/**
 * Runtime mapping of what kinds can be children of each kind.
 */
export const ChildKinds = {
  Schema: ['Object', 'Interface', 'Union', 'Scalar', 'Enum', 'InputObject'],
  Object: ['Field'],
  Interface: ['Field'],
  Field: ['Argument'],
  Directive: ['Argument'],
  InputObject: ['InputField'],
  Enum: ['EnumValue'],
} as const satisfies {
  [K in keyof ChildKindMap]: readonly ChildKindMap[K][]
}

/**
 * Get valid child kinds for a parent kind.
 */
export function getChildKinds<K extends keyof ChildKindMap>(
  parentKind: K,
): typeof ChildKinds[K]
export function getChildKinds(
  parentKind: string,
): readonly string[] | undefined
export function getChildKinds(
  parentKind: string,
): readonly string[] | undefined {
  return ChildKinds[parentKind as keyof typeof ChildKinds]
}

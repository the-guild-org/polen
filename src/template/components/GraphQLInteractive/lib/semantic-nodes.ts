/**
 * Semantic Node Types for GraphQL Interactive
 *
 * This module defines the semantic node types used to represent
 * GraphQL schema information alongside tree-sitter syntax nodes.
 */

import type {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
} from 'graphql'

/**
 * Wrapper for output fields that need parent type context
 */
export interface OutputFieldNode {
  kind: 'OutputField'
  parentType: GraphQLObjectType | GraphQLInterfaceType
  fieldDef: GraphQLField<any, any>
}

/**
 * Wrapper for input fields that need parent type context
 */
export interface InputFieldNode {
  kind: 'InputField'
  parentType: GraphQLInputObjectType
  fieldDef: GraphQLInputField
}

/**
 * Wrapper for arguments that need parent field context
 */
export interface ArgumentNode {
  kind: 'Argument'
  parentType: GraphQLObjectType | GraphQLInterfaceType
  parentField: GraphQLField<any, any>
  argumentDef: GraphQLArgument
}

/**
 * Wrapper for operation definitions
 */
export interface OperationNode {
  kind: 'Operation'
  type: 'query' | 'mutation' | 'subscription'
  name?: string
}

/**
 * Wrapper for variable references
 */
export interface VariableNode {
  kind: 'Variable'
  name: string
  type?: GraphQLInputType
}

/**
 * Wrapper for fragment definitions
 */
export interface FragmentNode {
  kind: 'Fragment'
  name: string
  onType: GraphQLNamedType
}

/**
 * Wrapper for invalid fields that don't exist in the schema
 */
export interface InvalidFieldNode {
  kind: 'InvalidField'
  fieldName: string
  parentType: GraphQLObjectType | GraphQLInterfaceType
  suggestion?: string
}

/**
 * Union of all semantic node types
 *
 * This union represents the different kinds of semantic information that can
 * be attached to GraphQL tokens during parsing. It includes both GraphQL's
 * native type classes (for type references) and our custom wrapper interfaces
 * (for context-dependent elements like fields and arguments).
 *
 * @example
 * ```typescript
 * // Type reference - uses GraphQL native class
 * const userType: SemanticNode = schema.getType('User')
 *
 * // Field reference - uses custom wrapper with context
 * const fieldSemantic: SemanticNode = {
 *   kind: 'OutputField',
 *   parentType: userType,
 *   fieldDef: userType.getFields()['name']
 * }
 * ```
 */
export type SemanticNode =
  // GraphQL's classes (used directly for type references)
  | GraphQLObjectType
  | GraphQLScalarType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLInputObjectType
  // Our wrappers (for context-dependent cases)
  | OutputFieldNode
  | InputFieldNode
  | ArgumentNode
  | OperationNode
  | VariableNode
  | FragmentNode
  | InvalidFieldNode

/**
 * Type guards for our custom wrapper types
 */
export function isOutputField(node: SemanticNode | undefined): node is OutputFieldNode {
  return node != null && 'kind' in node && node.kind === 'OutputField'
}

export function isInputField(node: SemanticNode | undefined): node is InputFieldNode {
  return node != null && 'kind' in node && node.kind === 'InputField'
}

export function isArgument(node: SemanticNode | undefined): node is ArgumentNode {
  return node != null && 'kind' in node && node.kind === 'Argument'
}

export function isOperation(node: SemanticNode | undefined): node is OperationNode {
  return node != null && 'kind' in node && node.kind === 'Operation'
}

export function isVariable(node: SemanticNode | undefined): node is VariableNode {
  return node != null && 'kind' in node && node.kind === 'Variable'
}

export function isFragment(node: SemanticNode | undefined): node is FragmentNode {
  return node != null && 'kind' in node && node.kind === 'Fragment'
}

export function isInvalidField(node: SemanticNode | undefined): node is InvalidFieldNode {
  return node != null && 'kind' in node && node.kind === 'InvalidField'
}

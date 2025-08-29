/**
 * Tree-sitter GraphQL Type System
 *
 * This module extends the typed exports from tree-sitter-graphql-grammar-wasm
 * with custom synthetic node types specific to Polen's interactive GraphQL viewer.
 */

import { TreeSitterGraphQL } from 'tree-sitter-graphql-grammar-wasm'
import type { Node as WebTreeSitterNode } from 'web-tree-sitter'

export { TreeSitterGraphQL } from 'tree-sitter-graphql-grammar-wasm'

/**
 * Custom node types we create for our parser implementation.
 */
export type CustomNodeType =
  | 'error_hint'
  | 'whitespace'

/**
 * Interface for custom nodes we create.
 */
export interface CustomNode extends WebTreeSitterNode {
  type: CustomNodeType
}

/**
 * Union of all possible GraphQL AST nodes including typed nodes from the package
 * and our custom synthetic nodes.
 */
export type GraphQLNode =
  | TreeSitterGraphQL.Node.Group.Any
  | CustomNode

/**
 * Type guard for custom nodes.
 */
export function isCustomNode(node: unknown): node is CustomNode {
  const customTypes: CustomNodeType[] = ['error_hint', 'whitespace']
  return node != null
    && typeof (node as any).type === 'string'
    && customTypes.includes((node as any).type as CustomNodeType)
}

/**
 * Type guard for any GraphQL node (including our custom types).
 */
export function isGraphQLNode(node: unknown): node is GraphQLNode {
  return isTreeSitterGraphQLNode(node)
    || isCustomNode(node)
}

/**
 * Type guard for nodes from the tree-sitter-graphql-grammar-wasm package.
 * This includes both named nodes and anonymous nodes.
 */
export function isTreeSitterGraphQLNode(node: unknown): node is TreeSitterGraphQL.Node.Group.Any {
  // The library now exports a comprehensive type system
  // We can check if it's any TreeSitterGraphQL.Node by checking the node structure
  return node != null
    && typeof (node as any).type === 'string'
    && typeof (node as any).startIndex === 'number'
    && typeof (node as any).endIndex === 'number'
    && !isCustomNode(node) // Exclude our custom nodes
}

/**
 * Get the type name of a node for debugging and error messages.
 */
export function getNodeTypeName(node: GraphQLNode): string {
  return node.type
}

/**
 * Safely cast a generic WebTreeSitter.Node to a typed GraphQL node.
 * Returns null if the node cannot be identified as a valid GraphQL node.
 */
export function castToGraphQLNode(node: WebTreeSitterNode): GraphQLNode | null {
  if (isGraphQLNode(node)) {
    return node
  }
  return null
}

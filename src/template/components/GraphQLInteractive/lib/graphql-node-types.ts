/**
 * Tree-sitter GraphQL Grammar Node Types
 *
 * This file defines all possible node types from the tree-sitter-graphql grammar.
 * These types are used by the tree-sitter parser when parsing GraphQL documents.
 *
 * Source: https://github.com/bkegley/tree-sitter-graphql
 *
 * Having these as a TypeScript union type enables:
 * - Type-safe node.type checking
 * - IntelliSense/autocomplete in IDEs
 * - Compile-time verification of node type strings
 * - Better code maintainability and refactoring
 */

/**
 * All possible node types that can be returned by tree-sitter-graphql
 * when parsing GraphQL documents.
 */
export type TreeSitterGraphQLNodeType =
  // Structure
  | 'document'
  | 'definition'
  | 'executable_definition'
  | 'type_system_definition'
  | 'type_system_extension'
  | 'source_file'
  // Operations
  | 'operation_definition'
  | 'selection_set'
  | 'selection'
  | 'field'
  | 'alias'
  // Fragments
  | 'fragment_definition'
  | 'fragment_spread'
  | 'inline_fragment'
  | 'fragment_name'
  | 'type_condition'
  // Arguments and Variables
  | 'arguments'
  | 'argument'
  | 'variable'
  | 'variable_definition'
  | 'variable_definitions'
  | 'default_value'
  // Types
  | 'type'
  | 'named_type'
  | 'list_type'
  | 'non_null_type'
  // Type Definitions
  | 'type_definition'
  | 'scalar_type_definition'
  | 'object_type_definition'
  | 'interface_type_definition'
  | 'union_type_definition'
  | 'enum_type_definition'
  | 'input_object_type_definition'
  // Type Extensions
  | 'type_extension'
  | 'scalar_type_extension'
  | 'object_type_extension'
  | 'interface_type_extension'
  | 'union_type_extension'
  | 'enum_type_extension'
  | 'input_object_type_extension'
  // Schema
  | 'schema_definition'
  | 'schema_extension'
  | 'root_operation_type_definition'
  // Field Definitions
  | 'fields_definition'
  | 'field_definition'
  | 'arguments_definition'
  | 'input_value_definition'
  | 'input_fields_definition'
  // Directives
  | 'directives'
  | 'directive'
  | 'directive_definition'
  | 'directive_locations'
  | 'directive_location'
  // Enum
  | 'enum_values_definition'
  | 'enum_value_definition'
  | 'enum_value'
  // Other Type System
  | 'implements_interfaces'
  | 'union_member_types'
  | 'description'
  // Values
  | 'value'
  | 'string_value'
  | 'int_value'
  | 'float_value'
  | 'boolean_value'
  | 'null_value'
  | 'list_value'
  | 'object_value'
  | 'object_field'
  // Basic tokens
  | 'name'
  | 'comment'
  | 'comma'
  // Punctuation tokens (anonymous nodes in the grammar)
  | '{'
  | '}'
  | '('
  | ')'
  | '['
  | ']'
  | ':'
  | '='
  | ','
  | '!'
  | '|'
  | '&'
  | '@'
  | '...'
  | '$'
  // GraphQL Keywords (these are also node types)
  | 'query'
  | 'mutation'
  | 'subscription'
  | 'fragment'
  | 'on'
  | 'type'
  | 'interface'
  | 'enum'
  | 'scalar'
  | 'union'
  | 'input'
  | 'schema'
  | 'directive'
  | 'implements'
  | 'extend'
  | 'true'
  | 'false'
  | 'null'
  // Custom synthetic nodes
  | 'error_hint'
  | 'whitespace'

/**
 * Subset of node types that are interactive in Polen's GraphQL viewer
 */
export type InteractiveNodeParentType =
  | 'named_type' // Type references like "Pokemon", "ID"
  | 'field' // Field selections like "name", "abilities"

/**
 * Subset of node types that are non-interactive user-defined names
 */
export type NonInteractiveNodeParentType =
  | 'operation_definition' // Operation names like "GetPokemon"
  | 'fragment_definition' // Fragment names like "PokemonDetails"
  | 'variable_definition' // Variable definitions (though the 'variable' node itself represents the usage)
  | 'argument' // Argument names

/**
 * Node types that represent keywords in GraphQL
 */
export type KeywordNodeType = 'query' | 'mutation' | 'subscription' | 'fragment' | 'on'

/**
 * Node types that represent literal values
 */
export type LiteralNodeType =
  | 'string_value'
  | 'int_value'
  | 'float_value'
  | 'boolean_value'
  | 'null_value'
  | 'enum_value'

/**
 * Node types that represent punctuation
 */
export type PunctuationNodeType =
  | '{'
  | '}'
  | '('
  | ')'
  | '['
  | ']'
  | ':'
  | '='
  | ','
  | '!'
  | '|'
  | '&'
  | '@'
  | '...'
  | '$'

/**
 * Helper function to check if a node type is a keyword
 */
export function isKeywordNodeType(type: string): type is KeywordNodeType {
  return type === 'query' || type === 'mutation' || type === 'subscription' || type === 'fragment' || type === 'on'
}

/**
 * Helper function to check if a node type is a literal
 */
export function isLiteralNodeType(type: string): type is LiteralNodeType {
  return type === 'string_value' || type === 'int_value' || type === 'float_value'
    || type === 'boolean_value' || type === 'null_value' || type === 'enum_value'
}

/**
 * Helper function to check if a node type is punctuation
 */
export function isPunctuationNodeType(type: string): type is PunctuationNodeType {
  return ['{', '}', '(', ')', '[', ']', ':', '=', ',', '!', '|', '&', '@', '...', '$'].includes(type)
}

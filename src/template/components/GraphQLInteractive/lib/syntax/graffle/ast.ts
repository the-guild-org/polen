/**
 * GraphQL AST to Graffle Document Builder Syntax Converter
 *
 * This module transforms a GraphQL AST into Graffle's JavaScript document builder syntax.
 * Graffle is a type-safe GraphQL client that uses a declarative object syntax for queries.
 *
 * @see https://graffle.js.org/examples/document-builder/document
 */

import { Ar, Ei } from '#dep/effect'
import { Data } from 'effect'
import type {
  ArgumentNode,
  DirectiveNode,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  SelectionNode,
  SelectionSetNode,
  ValueNode,
  VariableNode,
} from 'graphql'
import { Kind, OperationTypeNode } from 'graphql'

/**
 * Error thrown when GraphQL document contains variables, which are not supported in Graffle's document interface
 */
export class GraffleVariablesNotSupportedError extends Data.TaggedError('GraffleVariablesNotSupportedError')<{
  readonly operationName?: string
  readonly variableNames: readonly string[]
}> {}

/**
 * Error thrown when GraphQL document contains named fragments, which are not supported in Graffle's document interface
 */
export class GraffleFragmentsNotSupportedError extends Data.TaggedError('GraffleFragmentsNotSupportedError')<{
  readonly fragmentNames: readonly string[]
}> {}

/**
 * Graffle document structure
 */
export interface GraffleDocument {
  query?: Record<string, any>
  mutation?: Record<string, any>
  subscription?: Record<string, any>
}

/**
 * Graffle field selection
 * Can be:
 * - boolean (true for simple fields)
 * - [string, GraffleFieldSelection | boolean] (tuple for aliases: [originalFieldName, selection])
 * - GraffleFieldSelection (object with arguments, directives, and nested selections)
 */
export type GraffleSelection = boolean | [string, GraffleFieldSelection | boolean] | GraffleFieldSelection

export interface GraffleFieldSelection {
  $?: Record<string, any> // Arguments
  [key: string]: GraffleSelection | any // Nested selections, directives ($name), or inline fragments (___on_Type)
}

/**
 * Convert a GraphQL DocumentNode to Graffle document builder syntax
 */
export function convertDocument(
  document: DocumentNode,
): Ei.Either<GraffleDocument, GraffleVariablesNotSupportedError | GraffleFragmentsNotSupportedError> {
  const result: GraffleDocument = {}
  const fragments = new Map<string, FragmentDefinitionNode>()
  const fragmentNames: string[] = []

  // First pass: collect all fragment definitions
  for (const definition of document.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments.set(definition.name.value, definition)
      fragmentNames.push(definition.name.value)
    }
  }

  // Check if document contains named fragments
  if (fragmentNames.length > 0) {
    return Ei.left(
      new GraffleFragmentsNotSupportedError({
        fragmentNames,
      }),
    )
  }

  // Second pass: check for operations with variables and convert operations
  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      // Check if operation has variable definitions
      if (definition.variableDefinitions && definition.variableDefinitions.length > 0) {
        const variableNames = definition.variableDefinitions.map(v => v.variable.name.value)
        const error: { operationName?: string; variableNames: readonly string[] } = {
          variableNames,
        }
        if (definition.name?.value) {
          error.operationName = definition.name.value
        }
        return Ei.left(
          new GraffleVariablesNotSupportedError(error),
        )
      }

      const converted = convertOperationDefinition(definition, fragments)
      const operationType = definition.operation

      if (operationType === OperationTypeNode.QUERY) {
        result.query = { ...result.query, ...converted }
      } else if (operationType === OperationTypeNode.MUTATION) {
        result.mutation = { ...result.mutation, ...converted }
      } else if (operationType === OperationTypeNode.SUBSCRIPTION) {
        result.subscription = { ...result.subscription, ...converted }
      }
    }
  }

  return Ei.right(result)
}

/**
 * Convert an operation definition to Graffle syntax
 */
function convertOperationDefinition(
  operation: OperationDefinitionNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> {
  const selections = convertSelectionSet(operation.selectionSet, fragments)

  // For named operations, wrap in operation name
  if (operation.name) {
    return {
      [operation.name.value]: selections,
    }
  }

  // For anonymous operations, return selections directly
  return selections
}

/**
 * Convert a selection set to Graffle syntax
 */
function convertSelectionSet(
  selectionSet: SelectionSetNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const selection of selectionSet.selections) {
    const converted = convertSelection(selection, fragments)
    if (converted) {
      Object.assign(result, converted)
    }
  }

  return result
}

/**
 * Convert a single selection to Graffle syntax
 */
function convertSelection(
  selection: SelectionNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> | null {
  switch (selection.kind) {
    case Kind.FIELD:
      return convertFieldSelection(selection, fragments)
    case Kind.INLINE_FRAGMENT:
      return convertInlineFragment(selection, fragments)
    case Kind.FRAGMENT_SPREAD:
      return convertFragmentSpread(selection, fragments)
    default:
      return null
  }
}

/**
 * Convert a field selection to Graffle syntax
 */
function convertFieldSelection(
  field: FieldNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> {
  const fieldName = field.name.value
  const alias = field.alias?.value

  // For aliased fields, Graffle uses tuple format: [originalName, selection]
  if (alias) {
    // Build the selection object
    const selection: any = {}

    // Add arguments if present
    if (field.arguments && field.arguments.length > 0) {
      selection.$ = convertArguments(field.arguments)
    }

    // Add directives as properties directly in the selection
    if (field.directives && field.directives.length > 0) {
      const directives = convertDirectives(field.directives)
      Object.assign(selection, directives)
    }

    // Add sub-selections if present
    if (field.selectionSet) {
      const subSelections = convertSelectionSet(field.selectionSet, fragments)
      Object.assign(selection, subSelections)
    } else if (!field.arguments?.length && !field.directives?.length) {
      // For leaf fields without args/directives, just return tuple with true
      return {
        [alias]: [fieldName, true],
      }
    }

    return {
      [alias]: [fieldName, selection],
    }
  }

  // For non-aliased fields (no alias)
  if (!field.selectionSet) {
    // Check if we need to create a field object
    const hasArgs = field.arguments && field.arguments.length > 0
    const hasDirectives = field.directives && field.directives.length > 0

    if (hasArgs || hasDirectives) {
      const fieldObj: GraffleFieldSelection = {}

      if (hasArgs) {
        fieldObj.$ = convertArguments(field.arguments!)
      }

      // Add directives directly as properties
      if (hasDirectives) {
        const directives = convertDirectives(field.directives!)
        Object.assign(fieldObj, directives)
      }

      return {
        [fieldName]: fieldObj,
      }
    }

    // Simple field without metadata
    return {
      [fieldName]: true,
    }
  }

  // For fields with sub-selections (no alias)
  const subSelections = convertSelectionSet(field.selectionSet, fragments)
  const fieldSelection: GraffleFieldSelection = { ...subSelections }

  // Add arguments if present
  if (field.arguments && field.arguments.length > 0) {
    fieldSelection.$ = convertArguments(field.arguments)
  }

  // Add directives directly as properties
  if (field.directives && field.directives.length > 0) {
    const directives = convertDirectives(field.directives)
    Object.assign(fieldSelection, directives)
  }

  return {
    [fieldName]: fieldSelection,
  }
}

/**
 * Check if a field has arguments or directives
 */
function hasArgumentsOrDirectives(field: FieldNode): boolean {
  return (
    (field.arguments !== undefined && field.arguments.length > 0)
    || (field.directives !== undefined && field.directives.length > 0)
  )
}

/**
 * Create field selection with metadata (arguments/directives)
 */
function createFieldWithMetadata(field: FieldNode): GraffleFieldSelection {
  const result: GraffleFieldSelection = {}

  if (field.arguments && field.arguments.length > 0) {
    result.$ = convertArguments(field.arguments)
  }

  if (field.directives && field.directives.length > 0) {
    const directives = convertDirectives(field.directives)
    Object.assign(result, directives)
  }

  return result
}

/**
 * Convert field arguments to Graffle syntax
 */
function convertArguments(args: readonly ArgumentNode[]): Record<string, any> {
  const result: Record<string, any> = {}

  for (const arg of args) {
    result[arg.name.value] = convertValue(arg.value)
  }

  return result
}

/**
 * Convert directives to Graffle syntax
 * Directives are represented as $directiveName properties
 */
function convertDirectives(directives: readonly DirectiveNode[]): Record<string, any> {
  const result: Record<string, any> = {}

  for (const directive of directives) {
    const directiveName = `$${directive.name.value}`
    if (directive.arguments && directive.arguments.length > 0) {
      result[directiveName] = convertArguments(directive.arguments)
    } else {
      result[directiveName] = true
    }
  }

  return result
}

/**
 * Convert a GraphQL value to JavaScript value
 */
function convertValue(value: ValueNode): any {
  switch (value.kind) {
    case Kind.NULL:
      return null
    case Kind.INT:
      return parseInt(value.value, 10)
    case Kind.FLOAT:
      return parseFloat(value.value)
    case Kind.STRING:
      return value.value
    case Kind.BOOLEAN:
      return value.value
    case Kind.ENUM:
      return value.value // In Graffle, enums are strings
    case Kind.VARIABLE:
      // Variables should have been caught at the operation level
      // This is a fallback that should not be reached
      throw new Error(`Unexpected variable ${value.name.value} - variables should be caught at operation level`)
    case Kind.LIST:
      return value.values.map(v => convertValue(v))
    case Kind.OBJECT:
      const obj: Record<string, any> = {}
      for (const field of value.fields) {
        obj[field.name.value] = convertValue(field.value)
      }
      return obj
    default:
      return null
  }
}

/**
 * Convert an inline fragment to Graffle syntax
 * Inline fragments with type conditions are represented as ___on_TypeName properties
 */
function convertInlineFragment(
  fragment: InlineFragmentNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> {
  const selections = convertSelectionSet(fragment.selectionSet, fragments)

  // If there's a type condition, use the ___on_TypeName format
  if (fragment.typeCondition) {
    const typeName = fragment.typeCondition.name.value
    return {
      [`___on_${typeName}`]: selections,
    }
  }

  // If no type condition, just spread the selections
  return selections
}

/**
 * Convert a fragment spread to Graffle syntax
 */
function convertFragmentSpread(
  spread: FragmentSpreadNode,
  fragments: Map<string, FragmentDefinitionNode>,
): Record<string, any> {
  const fragmentDef = fragments.get(spread.name.value)
  if (!fragmentDef) {
    throw new Error(`Fragment ${spread.name.value} not found`)
  }

  // Convert the fragment's selection set
  return convertSelectionSet(fragmentDef.selectionSet, fragments)
}

/**
 * Convert a Graffle document to JavaScript code string
 * This is a simplified serializer for demonstration purposes
 */
export function graffleDocumentToString(doc: GraffleDocument, clientName = 'client'): string {
  const operations: string[] = []

  if (doc.query && Object.keys(doc.query).length > 0) {
    operations.push(`query: ${objectToString(doc.query, 2)}`)
  }
  if (doc.mutation && Object.keys(doc.mutation).length > 0) {
    operations.push(`mutation: ${objectToString(doc.mutation, 2)}`)
  }
  if (doc.subscription && Object.keys(doc.subscription).length > 0) {
    operations.push(`subscription: ${objectToString(doc.subscription, 2)}`)
  }

  const operationName = getFirstOperationName(doc)
  const runCall = operationName ? `.run('${operationName}')` : '.run()'

  return `await ${clientName}.document({
  ${operations.join(',\n  ')}
})${runCall}`
}

/**
 * Get the first operation name from the document
 */
function getFirstOperationName(doc: GraffleDocument): string | null {
  const queryKeys = doc.query ? Object.keys(doc.query) : []
  const mutationKeys = doc.mutation ? Object.keys(doc.mutation) : []
  const subscriptionKeys = doc.subscription ? Object.keys(doc.subscription) : []

  const firstKey = queryKeys[0] || mutationKeys[0] || subscriptionKeys[0]

  // Check if it's a named operation by looking if all non-meta keys are wrapped
  if (
    firstKey && typeof (doc.query?.[firstKey] || doc.mutation?.[firstKey] || doc.subscription?.[firstKey]) === 'object'
  ) {
    const value = doc.query?.[firstKey] || doc.mutation?.[firstKey] || doc.subscription?.[firstKey]
    if (!value) return null
    const keys = Object.keys(value)

    // Check if this looks like an operation name wrapper
    // It's a wrapper if it has field-like keys (not just meta properties)
    const hasFieldKeys = keys.some(k => !k.startsWith('$') && !k.startsWith('__'))

    // If the first key doesn't start with special chars and we have field keys inside it,
    // AND the first key itself is NOT a typical field name pattern (lowercase start),
    // then it's likely an operation name
    const firstChar = firstKey.charAt(0)
    if (hasFieldKeys && firstChar && firstChar === firstChar.toUpperCase()) {
      return firstKey
    }
  }

  return null
}

/**
 * Convert an object to a JavaScript object literal string
 */
function objectToString(obj: any, indent = 0): string {
  if (obj === true) return 'true'
  if (obj === false) return 'false'
  if (obj === null) return 'null'
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`
  if (typeof obj === 'number') return String(obj)

  // Handle variable references
  if (obj && typeof obj === 'object' && '__variable' in obj) {
    return `variables.${obj.__variable}`
  }

  if (Ar.isArray(obj)) {
    // Check if this is an alias tuple: [string, selection]
    if (obj.length === 2 && typeof obj[0] === 'string') {
      const fieldName = `'${obj[0]}'`
      const selection = objectToString(obj[1], indent)
      return `[${fieldName}, ${selection}]`
    }
    // Regular array
    const items = obj.map(item => objectToString(item, indent))
    return `[${items.join(', ')}]`
  }

  if (typeof obj === 'object') {
    const spaces = ' '.repeat(indent)
    const innerSpaces = ' '.repeat(indent + 2)

    // Sort keys to put special keys first
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      // Put $ (arguments) first, then $<directive> keys, then ___on_ keys, then regular fields
      const getOrder = (key: string) => {
        if (key === '$') return 0 // Arguments first
        if (key.startsWith('$')) return 1 // Directives second
        if (key.startsWith('___on_')) return 2 // Inline fragments third
        return 3 // Regular fields last
      }

      const aOrder = getOrder(a)
      const bOrder = getOrder(b)

      if (aOrder !== bOrder) return aOrder - bOrder
      return 0 // Keep original order for same category
    })

    const entries = sortedKeys.map(key => {
      const value = obj[key]
      // Handle special keys
      let keyStr = key
      if (key === '$') {
        // Arguments key needs quotes
        keyStr = `'$'`
      } else if (key.startsWith('___on_')) {
        // Inline fragment keys need quotes
        keyStr = `'${key}'`
      } else if (key.startsWith('$')) {
        // Directive keys don't need quotes (e.g., $include, $skip)
        keyStr = key
      }

      const valueStr = typeof value === 'object' && value !== null && !Ar.isArray(value) && !('__variable' in value)
        ? objectToString(value, indent + 2)
        : objectToString(value, indent)

      return `${innerSpaces}${keyStr}: ${valueStr}`
    })

    return `{\n${entries.join(',\n')}\n${spaces}}`
  }

  return String(obj)
}

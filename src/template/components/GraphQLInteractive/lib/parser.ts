/**
 * Tree-sitter GraphQL parsing with semantic analysis
 *
 * This module combines tree-sitter syntax parsing with GraphQL semantic
 * analysis to create unified tokens for interactive code blocks.
 */

import type { CodeAnnotation } from 'codehike/code'
import {
  getNamedType,
  type GraphQLArgument,
  GraphQLEnumType,
  type GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  type GraphQLOutputType,
  GraphQLScalarType,
  type GraphQLSchema,
  GraphQLUnionType,
  isInterfaceType,
  isObjectType,
} from 'graphql'
import graphqlWasmUrl from 'tree-sitter-graphql-grammar-wasm/grammar.wasm?url'
import * as WebTreeSitter from 'web-tree-sitter'
import treeSitterWasmUrl from 'web-tree-sitter/web-tree-sitter.wasm?url'
import {
  isKeywordNodeType,
  isLiteralNodeType,
  isPunctuationNodeType,
  type TreeSitterGraphQLNodeType,
} from './graphql-node-types.js'
import type { SemanticNode } from './semantic-nodes.js'
import {
  isArgument,
  isFragment,
  isInputField,
  isInvalidField,
  isOperation,
  isOutputField,
  isVariable,
} from './semantic-nodes.js'

/**
 * Unified token structure that combines tree-sitter and GraphQL semantics
 *
 * This interface represents a single parsed token from a GraphQL document,
 * enriched with semantic information from the GraphQL schema when available.
 * It provides a consistent API for accessing syntax highlighting, interactivity,
 * and CodeHike annotation data.
 *
 * @example
 * ```typescript
 * const tokens = await parseGraphQLWithTreeSitter(code, [], schema)
 * const fieldToken = tokens.find(t => t.text === 'name')
 *
 * if (fieldToken?.polen.isInteractive()) {
 *   const url = fieldToken.polen.getReferenceUrl()
 *   console.log(`Navigate to: ${url}`)
 * }
 * ```
 */
export interface GraphQLToken {
  /** Reference to the tree-sitter node that this token represents */
  treeSitterNode: WebTreeSitter.Node

  /**
   * Optional semantic information from GraphQL schema analysis
   * This includes type information, field definitions, and validation results
   */
  semantic?: SemanticNode

  /** Text content of the token (computed from tree-sitter node) */
  get text(): string

  /** Start character position in the source code (computed from tree-sitter node) */
  get start(): number

  /** End character position in the source code (computed from tree-sitter node) */
  get end(): number

  /** Polen specific functionality for interactive GraphQL documentation */
  polen: {
    /** Check if this token should be interactive (clickable/hoverable) */
    isInteractive: () => boolean
    /** Get the reference URL for navigation, or null if not applicable */
    getReferenceUrl: () => string | null
  }

  /** Syntax highlighting functionality */
  highlighter: {
    /** Get the CSS class name for styling this token */
    getCssClass: () => string
  }

  /** CodeHike integration for enhanced code block features */
  codeHike: {
    /** Array of CodeHike annotations that apply to this token */
    annotations: CodeAnnotation[]
  }
}

/**
 * Implementation of unified token
 */
class UnifiedToken implements GraphQLToken {
  public polen: { isInteractive: () => boolean; getReferenceUrl: () => string | null }
  public highlighter: { getCssClass: () => string }
  public codeHike: { annotations: CodeAnnotation[] }

  // Cache these values to avoid WASM access issues
  private _text: string
  private _start: number
  private _end: number
  private _nodeType: TreeSitterGraphQLNodeType

  constructor(
    public treeSitterNode: WebTreeSitter.Node,
    public semantic: SemanticNode | undefined,
    annotations: CodeAnnotation[],
  ) {
    // Cache the values immediately to avoid WASM access issues later
    // This works for both real WebTreeSitter nodes and synthetic nodes
    this._text = treeSitterNode.text
    this._start = treeSitterNode.startIndex
    this._end = treeSitterNode.endIndex
    this._nodeType = treeSitterNode.type as TreeSitterGraphQLNodeType

    this.codeHike = { annotations }

    // Polen namespace
    this.polen = {
      isInteractive: () => this._isInteractive(),
      getReferenceUrl: () => this._getReferenceUrl(),
    }

    // Highlighter namespace
    this.highlighter = {
      getCssClass: () => this._getCssClass(),
    }
  }

  get text(): string {
    return this._text
  }

  get start(): number {
    return this._start
  }

  get end(): number {
    return this._end
  }

  private _getCssClass(): string {
    const nodeType = this._nodeType

    // Development-only validation
    if (process.env['NODE_ENV'] === 'development') {
      // Validate that the node type is actually a valid TreeSitterGraphQLNodeType
      const validTypes = new Set([
        // Add a few common types for validation
        'document',
        'name',
        'field',
        'argument',
        'variable',
        'comment',
        'error_hint',
        'whitespace',
        'string_value',
        'int_value',
        'float_value',
        'query',
        'mutation',
        'subscription',
      ])

      if (!validTypes.has(nodeType as any) && !nodeType.match(/^[a-z_]+$/)) {
        console.warn(`Unknown tree-sitter node type: "${nodeType}". Consider adding to TreeSitterGraphQLNodeType.`)
      }
    }

    // Error hints
    if (nodeType === 'error_hint') {
      return 'graphql-error-hint'
    }

    // Comments
    if (nodeType === 'comment' || nodeType === 'description') {
      return 'graphql-comment'
    }

    // Keywords
    if (isKeywordNodeType(nodeType)) {
      return 'graphql-keyword'
    }

    // Literals
    if (nodeType === 'string_value') return 'graphql-string'
    if (nodeType === 'int_value' || nodeType === 'float_value') return 'graphql-number'

    // Punctuation
    if (isPunctuationNodeType(nodeType)) {
      return 'graphql-punctuation'
    }

    // Names - use semantic info for better classification
    if (nodeType === 'name') {
      // Check if this is an invalid field (has invalidField semantic)
      if (this.semantic && 'kind' in this.semantic && this.semantic.kind === 'InvalidField') {
        return 'graphql-field-error'
      }

      if (isOutputField(this.semantic) || isInputField(this.semantic)) {
        return 'graphql-field-interactive'
      }
      if (
        this.semantic instanceof GraphQLObjectType
        || this.semantic instanceof GraphQLScalarType
        || this.semantic instanceof GraphQLInterfaceType
      ) {
        return 'graphql-type-interactive'
      }
      if (isVariable(this.semantic)) {
        return 'graphql-variable'
      }
      if (isOperation(this.semantic)) {
        return 'graphql-operation'
      }
      if (isFragment(this.semantic)) {
        return 'graphql-fragment'
      }
      if (isArgument(this.semantic)) {
        return 'graphql-argument'
      }
    }

    // Variables
    if (nodeType === 'variable') return 'graphql-variable'

    return 'graphql-text'
  }

  private _isInteractive(): boolean {
    if (!this.semantic) return false

    // Fields, type references, arguments, and invalid fields are interactive
    return isOutputField(this.semantic)
      || isInputField(this.semantic)
      || isArgument(this.semantic)
      || isInvalidField(this.semantic) // Invalid fields should show error popovers
      || this.semantic instanceof GraphQLObjectType
      || this.semantic instanceof GraphQLScalarType
      || this.semantic instanceof GraphQLInterfaceType
      || this.semantic instanceof GraphQLUnionType
      || this.semantic instanceof GraphQLEnumType
      || this.semantic instanceof GraphQLInputObjectType
  }

  private _getReferenceUrl(): string | null {
    if (!this.semantic) return null

    // Arguments - use #<field>__<argument> pattern
    if (isArgument(this.semantic)) {
      return `/reference/${this.semantic.parentType.name}#${this.semantic.parentField.name}__${this.semantic.argumentDef.name}`
    }

    // Output fields - use hash links since field routes aren't connected yet
    if (isOutputField(this.semantic)) {
      return `/reference/${this.semantic.parentType.name}#${this.semantic.fieldDef.name}`
    }

    // Input fields - use hash links since field routes aren't connected yet
    if (isInputField(this.semantic)) {
      return `/reference/${this.semantic.parentType.name}#${this.semantic.fieldDef.name}`
    }

    // Type references - use :type pattern
    if (this.semantic instanceof GraphQLObjectType) {
      return `/reference/${this.semantic.name}`
    }

    if (this.semantic instanceof GraphQLScalarType) {
      return `/reference/${this.semantic.name}`
    }

    if (this.semantic instanceof GraphQLInterfaceType) {
      return `/reference/${this.semantic.name}`
    }

    if (this.semantic instanceof GraphQLUnionType) {
      return `/reference/${this.semantic.name}`
    }

    if (this.semantic instanceof GraphQLEnumType) {
      return `/reference/${this.semantic.name}`
    }

    if (this.semantic instanceof GraphQLInputObjectType) {
      return `/reference/${this.semantic.name}`
    }

    return null
  }
}

// Cache for the parser instance
let parserPromise: Promise<WebTreeSitter.Parser> | null = null

/**
 * Minimal synthetic node that implements just enough of the WebTreeSitter.Node interface
 * Uses TreeSitterGraphQLNodeType for type safety
 *
 * IMPORTANT: This must be a class with getters to match WebTreeSitter.Node's WASM interface.
 * Plain objects with properties will cause "memory access out of bounds" errors when
 * tree-sitter tries to call the WASM getter functions.
 */
class SyntheticNode {
  constructor(
    public type: TreeSitterGraphQLNodeType,
    private _text: string,
    private _startIndex: number,
    private _endIndex: number,
  ) {}

  // These getters match WebTreeSitter.Node's interface
  get text(): string {
    return this._text
  }

  get startIndex(): number {
    return this._startIndex
  }

  get endIndex(): number {
    return this._endIndex
  }

  get childCount(): number {
    return 0
  }

  get parent(): null {
    return null
  }
}

/**
 * Tracks semantic context while walking the tree-sitter AST
 *
 * This class maintains the current GraphQL execution context as we traverse
 * the syntax tree, allowing us to resolve field references to their schema
 * definitions and validate field access.
 *
 * ## Context Management Strategy
 *
 * The semantic context uses a stack-based approach to track the current type context
 * as we traverse nested GraphQL selections. This is essential for resolving field
 * references since field names are only meaningful within their parent type context.
 *
 * ### Type Stack Management:
 * - Each stack entry contains: { type: GraphQLType, field?: GraphQLField }
 * - The `field` property tracks the field that led us to this type level
 * - Stack depth corresponds to GraphQL selection nesting depth
 * - Root level: operation root type (Query/Mutation/Subscription)
 * - Nested levels: field return types that support sub-selections
 *
 * ### Context Transitions:
 * - `enterOperation()`: Sets root type based on operation type
 * - `enterField()`: Pushes field's return type if it's selectable (Object/Interface)
 * - `exitField()`: Pops from stack when leaving a field's selection set
 * - `enterFragment()`: Switches context to fragment's target type
 *
 * ### Argument Resolution Challenge:
 * Arguments appear in the AST before their parent field context is established,
 * requiring the complex lookup logic documented in the argument parsing section.
 *
 * @example
 * ```typescript
 * const context = new SemanticContext(schema)
 * context.enterOperation('query')     // Stack: [Query]
 * context.enterField('user')          // Stack: [Query, User]
 * const fieldInfo = context.getFieldInfo('name') // Gets User.name field
 * context.exitField()                 // Stack: [Query]
 * ```
 */
class SemanticContext {
  /**
   * Stack of type contexts representing the current selection path.
   * Each entry tracks the type we're currently selecting from and optionally
   * the field that brought us to this type level.
   */
  private typeStack: Array<{ type: GraphQLObjectType | GraphQLInterfaceType; field?: GraphQLField<any, any> }> = []

  /** Current operation type, set when entering an operation definition */
  operationType: 'query' | 'mutation' | 'subscription' | null = null

  /** GraphQL schema used for type lookups and validation */
  schema: GraphQLSchema

  constructor(schema: GraphQLSchema) {
    this.schema = schema
  }

  enterOperation(type: string) {
    this.operationType = type as 'query' | 'mutation' | 'subscription'
    const rootType = type === 'query'
      ? this.schema.getQueryType()
      : type === 'mutation'
      ? this.schema.getMutationType()
      : type === 'subscription'
      ? this.schema.getSubscriptionType()
      : null

    if (rootType) {
      this.typeStack = [{ type: rootType }]
    }
  }

  enterFragment(typeName: string) {
    const type = this.schema.getType(typeName)

    if (type && (isObjectType(type) || isInterfaceType(type))) {
      this.typeStack = [{ type }]
    }
  }

  getFieldInfo(
    fieldName: string,
  ): { parentType: GraphQLObjectType | GraphQLInterfaceType; fieldDef: GraphQLField<any, any> } | null {
    const current = this.typeStack[this.typeStack.length - 1]
    if (!current) return null

    const fields = current.type.getFields()
    const fieldDef = fields[fieldName]

    if (fieldDef) {
      return { parentType: current.type, fieldDef }
    }
    return null
  }

  enterField(fieldName: string) {
    const fieldInfo = this.getFieldInfo(fieldName)
    if (fieldInfo) {
      // Only push to stack if field type is object/interface
      const fieldType = getNamedType(fieldInfo.fieldDef.type)
      if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
        // Push new context with the field that brought us here
        this.typeStack.push({ type: fieldType, field: fieldInfo.fieldDef })
      }
    }
  }

  exitField() {
    // Only pop if we're not at root and the last entry has a field
    // (meaning it was pushed by enterField for an object/interface type)
    if (this.typeStack.length > 1) {
      const last = this.typeStack[this.typeStack.length - 1]
      if (last && last.field) {
        this.typeStack.pop()
      }
    }
  }

  getArgumentInfo(argName: string) {
    const current = this.typeStack[this.typeStack.length - 1]
    if (!current?.field) return null

    const arg = current.field.args.find(a => a.name === argName)
    return arg ? { field: current.field, arg, parentType: current.type } : null
  }

  getCurrentType(): (GraphQLObjectType | GraphQLInterfaceType) | null {
    const current = this.typeStack[this.typeStack.length - 1]
    return current?.type || null
  }

  lookupType(typeName: string) {
    return this.schema.getType(typeName)
  }

  reset() {
    this.typeStack = []
    this.operationType = null
  }
}

/**
 * Parse GraphQL code into interactive tokens with semantic information
 *
 * @param code - The raw GraphQL code to parse
 * @param annotations - CodeHike annotations that might affect rendering
 * @param schema - Optional GraphQL schema for semantic analysis
 * @returns Array of tokens representing the parsed code
 */
export async function parseGraphQLWithTreeSitter(
  code: string,
  annotations: CodeAnnotation[] = [],
  schema?: GraphQLSchema,
): Promise<GraphQLToken[]> {
  // Validate input
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid GraphQL code: code must be a non-empty string')
  }

  // Prevent parsing extremely large documents that could cause performance issues
  if (code.length > 100_000) {
    throw new Error('GraphQL document too large: maximum 100,000 characters allowed')
  }

  // Step 1: Parse with tree-sitter
  const parser = await getParser()
  const tree = parser.parse(code)

  if (!tree) {
    throw new Error('Tree-sitter failed to parse GraphQL code')
  }

  // Check if tree-sitter found syntax errors (disabled for now as it may be too strict)
  // if (tree.rootNode.hasError) {
  //   throw new Error('GraphQL syntax error detected by tree-sitter parser')
  // }

  try {
    // Step 2: Walk tree and attach semantics
    const tokens = collectTokensWithSemantics(tree, code, schema, annotations)

    // Step 3: Add error hint tokens after invalid fields
    const tokensWithHints = addErrorHintTokens(tokens, code, annotations)

    return tokensWithHints
  } finally {
    // ## Tree-sitter Resource Lifecycle Management
    //
    // Tree-sitter creates native WASM objects that must be explicitly freed to prevent memory leaks.
    // The tree object holds references to parsed nodes and internal parser state that won't be
    // garbage collected automatically by JavaScript.
    //
    // Critical cleanup points:
    // 1. Always call tree.delete() in a finally block to ensure cleanup even on errors
    // 2. Do not access tree or any of its nodes after calling delete()
    // 3. The parser instance is cached globally and reused across multiple parsing calls
    //
    // Memory safety: Once tree.delete() is called, all WebTreeSitter.Node references become invalid.
    // Our tokens hold references to these nodes, but only use their text and position properties
    // which are copied during token creation, so the nodes can be safely deleted.
    tree.delete()
  }
}

/**
 * Get or create the tree-sitter parser instance
 */
async function getParser(): Promise<WebTreeSitter.Parser> {
  if (!parserPromise) {
    parserPromise = initializeTreeSitter()
  }
  return parserPromise
}

/**
 * Initialize tree-sitter with the GraphQL grammar
 */
async function initializeTreeSitter(): Promise<WebTreeSitter.Parser> {
  try {
    // Handle different environments
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

    if (isNode) {
      // Node.js environment (tests)
      const fs = await import('node:fs/promises')
      const path = await import('node:path')

      // Find the actual WASM files in node_modules
      const treeSitterWasmPath = path.join(process.cwd(), 'node_modules/web-tree-sitter/tree-sitter.wasm')
      const graphqlWasmPath = path.join(process.cwd(), 'node_modules/tree-sitter-graphql-grammar-wasm/grammar.wasm')

      await WebTreeSitter.Parser.init({
        locateFile: (filename: string) => {
          if (filename === 'tree-sitter.wasm') {
            return treeSitterWasmPath
          }
          return filename
        },
      })

      const parser = new WebTreeSitter.Parser()
      const wasmBuffer = await fs.readFile(graphqlWasmPath)
      const GraphQL = await WebTreeSitter.Language.load(new Uint8Array(wasmBuffer))
      parser.setLanguage(GraphQL)

      return parser
    } else {
      // Browser/Vite environment
      await WebTreeSitter.Parser.init({
        locateFile: (filename: string) => {
          if (filename === 'tree-sitter.wasm') {
            return treeSitterWasmUrl
          }
          return filename
        },
      })

      const parser = new WebTreeSitter.Parser()

      // Fetch the WASM file as a buffer
      const response = await fetch(graphqlWasmUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to load GraphQL grammar file: ${response.status} ${response.statusText}. `
            + `This may indicate a network issue or missing grammar file.`,
        )
      }

      const wasmBuffer = await response.arrayBuffer()

      if (wasmBuffer.byteLength === 0) {
        throw new Error('GraphQL grammar file is empty or corrupted')
      }

      const GraphQL = await WebTreeSitter.Language.load(new Uint8Array(wasmBuffer))
      parser.setLanguage(GraphQL)

      return parser
    }
  } catch (error) {
    // Enhance error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error(`Tree-sitter initialization failed: ${error.message}. Check your network connection.`)
      }
      if (error.message.includes('Language.load')) {
        throw new Error(`Failed to load GraphQL grammar: ${error.message}. The grammar file may be corrupted.`)
      }
    }
    throw error
  }
}

/**
 * Add error hint tokens after invalid fields
 */
function addErrorHintTokens(
  tokens: GraphQLToken[],
  code: string,
  annotations: CodeAnnotation[],
): GraphQLToken[] {
  const tokensWithHints: GraphQLToken[] = []
  const processedIndices = new Set<number>()

  // Count invalid fields for debugging
  let invalidFieldCount = 0
  tokens.forEach(t => {
    if (t.semantic && 'kind' in t.semantic && t.semantic.kind === 'InvalidField') {
      invalidFieldCount++
    }
  })

  if (invalidFieldCount > 10) {
    // Too many invalid fields - likely a schema mismatch
    // Return tokens without error hints to avoid corrupting display
    console.warn(`Polen: ${invalidFieldCount} invalid fields detected. Schema may not match queries.`)
    return tokens
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!

    // Skip if we've already processed this token (due to lookahead for arguments)
    if (processedIndices.has(i)) {
      continue
    }

    tokensWithHints.push(token)
    processedIndices.add(i)

    // Check if this is an invalid field
    if (token.semantic && 'kind' in token.semantic && token.semantic.kind === 'InvalidField') {
      // Look ahead to find where the field ends (after arguments if present)
      let fieldEndIndex = i
      let j = i + 1

      // Skip whitespace
      while (j < tokens.length && tokens[j]!.treeSitterNode.type === 'whitespace') {
        j++
      }

      // Check if we have arguments starting with '('
      if (j < tokens.length && tokens[j]!.text === '(') {
        // Find the matching closing ')'
        let parenDepth = 1
        j++ // move past the opening '('

        while (j < tokens.length && parenDepth > 0) {
          const t = tokens[j]!
          if (t.text === '(') parenDepth++
          else if (t.text === ')') parenDepth--
          j++
        }

        // j is now past the closing ')'
        fieldEndIndex = j - 1

        // Add all tokens that are part of the field's arguments
        for (let k = i + 1; k <= fieldEndIndex; k++) {
          if (k < tokens.length && !processedIndices.has(k)) {
            tokensWithHints.push(tokens[k]!)
            processedIndices.add(k)
          }
        }
      }

      // Now add the error hint after the complete field (including arguments)
      const lastFieldToken = tokens[fieldEndIndex] || token
      const hintText = ' ← No such field'
      const hintToken = new UnifiedToken(
        createSyntheticNode(
          'error_hint',
          hintText,
          lastFieldToken.end,
          lastFieldToken.end + hintText.length,
        ),
        undefined,
        annotations,
      )
      tokensWithHints.push(hintToken)
    }
  }

  return tokensWithHints
}

/**
 * Walk tree-sitter AST and collect tokens with semantic information
 */
function collectTokensWithSemantics(
  tree: WebTreeSitter.Tree,
  code: string,
  schema: GraphQLSchema | undefined,
  annotations: CodeAnnotation[],
): GraphQLToken[] {
  const tokens: GraphQLToken[] = []
  const cursor = tree.walk()
  const context = schema ? new SemanticContext(schema) : null
  let lastEnd = 0

  function processNode() {
    const node = cursor.currentNode
    if (!node) return

    // Handle different node types for semantic context
    if (context) {
      if (node.type === 'operation_definition') {
        // Find the operation type child
        const operationType = findChildByType(cursor, 'operation_type')
        if (operationType) {
          context.enterOperation(operationType.text)
        }
      }

      if (node.type === 'fragment_definition') {
        // Find the type condition
        const typeCondition = findChildByType(cursor, 'type_condition')
        if (typeCondition) {
          const typeName = findChildByType(cursor, 'named_type', typeCondition)
          if (typeName) {
            const nameNode = findChildByType(cursor, 'name', typeName)
            if (nameNode) {
              context.enterFragment(nameNode.text)
            }
          }
        }
      }

      // We don't need special handling for selection_set anymore
      // Context is managed at the field level
    }

    // Collect leaf tokens with semantic info
    // Special case: string_value, int_value, float_value nodes should be collected as whole tokens
    // even though they have children (the quotes or signs)
    const isValueNode = node.type === 'string_value' || node.type === 'int_value' || node.type === 'float_value'
    const shouldCollectToken = (node.childCount === 0 || isValueNode) && node.text.trim() !== ''

    if (shouldCollectToken) {
      // Add whitespace before this token if needed
      if (node.startIndex > lastEnd) {
        const whitespace = code.slice(lastEnd, node.startIndex)
        tokens.push(
          new UnifiedToken(
            createWhitespaceNode(whitespace, lastEnd, node.startIndex),
            undefined,
            annotations,
          ),
        )
      }

      // Determine semantic info for this token
      let semantic: SemanticNode | undefined

      if (context && node.type === 'name') {
        const parent = cursor.currentNode.parent

        if (parent?.type === 'field') {
          // This is a field name - get info from current context
          const fieldInfo = context.getFieldInfo(node.text)
          const currentType = context.getCurrentType()

          if (fieldInfo) {
            semantic = {
              kind: 'OutputField',
              parentType: fieldInfo.parentType,
              fieldDef: fieldInfo.fieldDef,
            }
            // Enter this field's context for processing its selection set
            context.enterField(node.text)
          } else if (currentType) {
            // Field doesn't exist - mark as invalid
            semantic = {
              kind: 'InvalidField',
              fieldName: node.text,
              parentType: currentType,
            }
          }
        } else if (parent?.type === 'named_type') {
          // This is a type reference
          const type = context.lookupType(node.text)
          if (type) {
            // Check if it's one of the types we support as semantic nodes
            if (
              type instanceof GraphQLObjectType
              || type instanceof GraphQLScalarType
              || type instanceof GraphQLInterfaceType
              || type instanceof GraphQLUnionType
              || type instanceof GraphQLEnumType
              || type instanceof GraphQLInputObjectType
            ) {
              semantic = type
            }
          }
        } else if (parent?.type === 'operation_definition') {
          // This is an operation name
          semantic = {
            kind: 'Operation',
            type: context.operationType || 'query',
            name: node.text,
          }
        } else if (parent?.type === 'fragment_definition') {
          // This is a fragment name - for now just mark it as a fragment
          semantic = {
            kind: 'Fragment',
            name: node.text,
            onType: context.getCurrentType()!, // We'll have the type from enterFragment
          }
        } else if (parent?.type === 'argument') {
          // This is an argument name
          //
          // ## Complex Argument Parsing Logic
          //
          // Arguments require complex tree traversal because they appear in the tree-sitter AST
          // before the semantic context has been updated for their parent field. This creates
          // a chicken-and-egg problem where we need the field to identify the argument, but
          // the field hasn't been processed yet.
          //
          // Tree structure: field > arguments > argument > name
          // Processing order: argument names are parsed before field context is established
          //
          // Our solution is to traverse up the AST to find the field node, then look for that
          // field in both the root operation type and the current type context. We check the
          // root type first because top-level fields (like Query.pokemon) are most common.

          let argumentsNode = parent.parent
          if (argumentsNode && argumentsNode.type === 'arguments') {
            let fieldNode = argumentsNode.parent
            if (fieldNode && fieldNode.type === 'field') {
              // Find the field name node within the field node
              for (let i = 0; i < fieldNode.childCount; i++) {
                const child = fieldNode.child(i)
                if (child && child.type === 'name') {
                  // We need to find the parent type that contains this field
                  // Start with the root type based on the operation type (query/mutation/subscription)
                  const rootType = context.schema.getQueryType() || context.schema.getMutationType()
                    || context.schema.getSubscriptionType()

                  if (rootType) {
                    // First check if the field exists on the root type (most common case)
                    let field = rootType.getFields()[child.text]
                    let parentType: GraphQLObjectType | GraphQLInterfaceType = rootType

                    // If not found on root, check the current type in our semantic context
                    // This handles nested field arguments like User.posts(limit: 10)
                    if (!field) {
                      const currentType = context.getCurrentType()
                      if (currentType) {
                        field = currentType.getFields()[child.text]
                        parentType = currentType
                      }
                    }

                    if (field && parentType) {
                      const arg = field.args.find((a: GraphQLArgument) => a.name === node.text)
                      if (arg) {
                        semantic = {
                          kind: 'Argument',
                          parentType: parentType,
                          parentField: field,
                          argumentDef: arg,
                        }
                      }
                    }
                  }
                  break
                }
              }
            }
          }
        } else if (parent?.type === 'variable') {
          // This is a variable name (without the $)
          semantic = {
            kind: 'Variable',
            name: node.text,
          }
        } else if (parent?.type === 'variable_definition') {
          // This is a variable definition in the operation header
          semantic = {
            kind: 'Variable',
            name: node.text,
          }
        }
      } else if (context && node.type === 'variable' && node.text.startsWith('$')) {
        // This is the full variable including $ (usage in arguments or directives)
        semantic = {
          kind: 'Variable',
          name: node.text.slice(1),
        }
      }

      const token = new UnifiedToken(
        node,
        semantic,
        annotations,
      )

      tokens.push(token)

      lastEnd = node.endIndex
    }

    // Traverse children (but skip children of value nodes since we collect them as whole tokens)
    if (!isValueNode && cursor.gotoFirstChild()) {
      do {
        processNode()
      } while (cursor.gotoNextSibling())
      cursor.gotoParent()

      // Handle context exit
      if (context && node.type === 'field') {
        // Only exit field context if this field has a selection set
        // (meaning it's an object/interface type that pushed to the stack)
        const hasSelectionSet = node.childCount > 0 && node.children.some(
          child => child?.type === 'selection_set',
        )
        if (hasSelectionSet) {
          context.exitField()
        }
      } else if (context && (node.type === 'operation_definition' || node.type === 'fragment_definition')) {
        // Reset context when exiting operation or fragment
        context.reset()
      }
    }
  }

  processNode()

  // Add final whitespace if needed
  if (lastEnd < code.length) {
    const remaining = code.slice(lastEnd)
    tokens.push(
      new UnifiedToken(
        createWhitespaceNode(remaining, lastEnd, code.length),
        undefined,
        annotations,
      ),
    )
  }

  return tokens
}

/**
 * Helper to find a child node by type
 */
function findChildByType(
  cursor: WebTreeSitter.TreeCursor,
  type: string,
  node?: WebTreeSitter.Node,
): WebTreeSitter.Node | null {
  const targetNode = node || cursor.currentNode
  if (!targetNode) return null

  for (let i = 0; i < targetNode.childCount; i++) {
    const child = targetNode.child(i)
    if (child && child.type === type) {
      return child
    }
  }
  return null
}

/**
 * Create a pseudo tree-sitter node for whitespace
 */
function createWhitespaceNode(text: string, start: number, end: number): WebTreeSitter.Node {
  // Create a synthetic node with proper getter interface
  const node = new SyntheticNode('whitespace', text, start, end)
  return node as unknown as WebTreeSitter.Node
}

/**
 * Create a pseudo tree-sitter node for synthetic content
 *
 * ## Annotation Architecture
 *
 * Polen uses synthetic tree-sitter nodes to inject additional content into GraphQL code blocks.
 * This approach was chosen after considering several alternatives:
 *
 * ### Current Approach: Synthetic Nodes
 * We create fake tree-sitter nodes that implement just enough of the Node interface to flow
 * through our token rendering pipeline. This is used for error hints that appear after invalid fields.
 *
 * **When to use**: When you need to add new content to the code block (not just style existing content)
 *
 * ### Alternative Approaches Considered:
 *
 * 1. **CodeHike Annotations**
 *    - Use CodeHike's built-in InlineAnnotation/BlockAnnotation system
 *    - Pros: Works with CodeHike's architecture, composable with other handlers
 *    - Cons: More complex, requires understanding CodeHike's annotation pipeline
 *    - Best for: Complex features like collapsible sections, tabs
 *
 * 2. **Post-Processing During Render**
 *    - Keep tokens unchanged, add content during the rendering phase
 *    - Pros: Simpler, no fake nodes needed
 *    - Cons: Rendering logic becomes more complex, harder to test
 *    - Best for: Simple conditional content
 *
 * 3. **Token Metadata/Props**
 *    - Add annotation data to token properties rather than creating new tokens
 *    - Pros: Clean data model, easy to test
 *    - Cons: Can't add new content, only modify existing tokens
 *    - Best for: Styling annotations (highlights, emphasis, underlines)
 *
 * ### Guidelines for Future Annotations:
 *
 * - **Styling only** (highlights, emphasis): Use token metadata/props
 * - **Adding content** (error hints, tooltips): Use synthetic nodes (current approach)
 * - **Complex UI** (collapsible, tabs): Consider CodeHike annotation handlers
 * - **User-defined annotations**: Choose based on what the annotation does
 *
 * The synthetic node approach works well for Polen's error hints because we're actually
 * inserting new text content ("← No such field") that needs to be positioned and styled
 * like a regular token.
 */
function createSyntheticNode(
  type: TreeSitterGraphQLNodeType,
  text: string,
  start: number,
  end: number,
): WebTreeSitter.Node {
  // Create a synthetic node with proper getter interface
  const node = new SyntheticNode(type, text, start, end)
  return node as unknown as WebTreeSitter.Node
}

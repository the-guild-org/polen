/**
 * GraphQL Semantic Joining Sandbox - Refined Version
 *
 * This sandbox demonstrates our refined approach:
 * 1. Tree-sitter nodes (for positions)
 * 2. GraphQL semantic nodes (mix of GraphQL classes + our wrappers)
 * 3. Unified tokens with plugin architecture
 */

import {
  type ArgumentNode,
  type ASTNode,
  buildSchema,
  type FieldNode,
  type FragmentDefinitionNode,
  type GraphQLArgument,
  GraphQLEnumType,
  GraphQLInputObjectType,
  type GraphQLInputType,
  GraphQLInterfaceType,
  type GraphQLNamedType,
  GraphQLObjectType,
  type GraphQLOutputType,
  GraphQLScalarType,
  type GraphQLSchema,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
  type OperationDefinitionNode,
  parse as parseGraphQL,
  TypeInfo,
  type VariableDefinitionNode,
  visit,
  visitWithTypeInfo,
} from 'graphql'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TreeSitterGraphQL } from 'tree-sitter-graphql-grammar-wasm/tree-sitter-graphql'
import * as WebTreeSitter from 'web-tree-sitter'

// Get filesystem paths for WASM files
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../..')

const treeSitterWasmPath = join(projectRoot, 'node_modules', 'web-tree-sitter', 'tree-sitter.wasm')
const graphqlWasmPath = join(projectRoot, 'node_modules', 'tree-sitter-graphql-grammar-wasm', 'grammar.wasm')

/*
 * ================================================================================
 * SAMPLE DATA
 * ================================================================================
 */

const QUERY = `query GetPokemon($id: ID!) {
  pokemon(id: $id) {
    name
    type
    abilities {
      name
      effect
    }
    stats {
      hp
      attack
    }
  }
}`

const SCHEMA_SDL = `
type Query {
  pokemon(id: ID!): Pokemon
}

type Pokemon {
  id: ID!
  name: String!
  type: String!
  abilities: [Ability!]!
  stats: Stats!
}

type Ability {
  id: ID!
  name: String!
  effect: String
}

type Stats {
  hp: Int!
  attack: Int!
  defense: Int!
}
`

/*
 * ================================================================================
 * SEMANTIC NODE TYPES
 * ================================================================================
 */

// Our custom wrappers for cases where GraphQL classes aren't enough
interface OutputFieldNode {
  kind: 'OutputField'
  parentType: GraphQLObjectType | GraphQLInterfaceType
  fieldDef: any // GraphQLFieldDefinition type
}

interface InputFieldNode {
  kind: 'InputField'
  parentType: GraphQLInputObjectType
  fieldDef: any // GraphQLInputFieldDefinition type
}

interface ArgumentSemanticNode {
  kind: 'Argument'
  parentField: any // GraphQLFieldDefinition type
  argumentDef: GraphQLArgument
}

interface OperationNode {
  kind: 'Operation'
  type: 'query' | 'mutation' | 'subscription'
  name?: string
}

interface VariableNode {
  kind: 'Variable'
  name: string
  type?: GraphQLInputType
}

interface FragmentNode {
  kind: 'Fragment'
  name: string
  onType: GraphQLNamedType
}

// Hybrid union: GraphQL classes + our wrappers
type SemanticNode =
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
  | ArgumentSemanticNode
  | OperationNode
  | VariableNode
  | FragmentNode

// Type guards
function isOutputField(node: SemanticNode | undefined): node is OutputFieldNode {
  return node != null && 'kind' in node && node.kind === 'OutputField'
}

function isInputField(node: SemanticNode | undefined): node is InputFieldNode {
  return node != null && 'kind' in node && node.kind === 'InputField'
}

function isArgument(node: SemanticNode | undefined): node is ArgumentSemanticNode {
  return node != null && 'kind' in node && node.kind === 'Argument'
}

function isOperation(node: SemanticNode | undefined): node is OperationNode {
  return node != null && 'kind' in node && node.kind === 'Operation'
}

function isVariable(node: SemanticNode | undefined): node is VariableNode {
  return node != null && 'kind' in node && node.kind === 'Variable'
}

/*
 * ================================================================================
 * UNIFIED TOKEN STRUCTURE
 * ================================================================================
 */

interface UnifiedToken {
  // Core references
  treeSitterNode: WebTreeSitter.Node
  semantic?: SemanticNode

  // "Plugin" computed properties
  polen: {
    isInteractive: () => boolean
    getReferenceUrl: () => string | null
  }

  highlighting: {
    getCssClass: () => string
  }
}

/*
 * ================================================================================
 * PLUGIN IMPLEMENTATIONS
 * ================================================================================
 */

const polenPlugin = {
  isInteractive(semantic?: SemanticNode): boolean {
    if (!semantic) return false

    // Fields and type references are interactive
    return isOutputField(semantic)
      || isInputField(semantic)
      || semantic instanceof GraphQLObjectType
      || semantic instanceof GraphQLScalarType
      || semantic instanceof GraphQLInterfaceType
      || semantic instanceof GraphQLUnionType
      || semantic instanceof GraphQLEnumType
  },

  getReferenceUrl(semantic?: SemanticNode): string | null {
    if (!semantic) return null

    // Output fields
    if (isOutputField(semantic)) {
      return `/reference/${semantic.parentType.name}#${semantic.fieldDef.name}`
    }

    // Input fields
    if (isInputField(semantic)) {
      return `/reference/input/${semantic.parentType.name}#${semantic.fieldDef.name}`
    }

    // Type references
    if (semantic instanceof GraphQLObjectType) {
      return `/reference/${semantic.name}`
    }

    if (semantic instanceof GraphQLScalarType) {
      return `/reference/scalars#${semantic.name}`
    }

    if (semantic instanceof GraphQLInterfaceType) {
      return `/reference/interfaces#${semantic.name}`
    }

    if (semantic instanceof GraphQLUnionType) {
      return `/reference/unions#${semantic.name}`
    }

    if (semantic instanceof GraphQLEnumType) {
      return `/reference/enums#${semantic.name}`
    }

    if (semantic instanceof GraphQLInputObjectType) {
      return `/reference/input/${semantic.name}`
    }

    return null
  },
}

const highlightPlugin = {
  getCssClass(tsNode: WebTreeSitter.Node, semantic?: SemanticNode): string {
    // Use tree-sitter node type for basic highlighting
    const nodeType = tsNode.type
    const parentType = tsNode.parent?.type

    // Keywords
    if (['query', 'mutation', 'subscription', 'fragment', 'on'].includes(nodeType)) {
      return 'keyword'
    }

    // Literals
    if (nodeType === 'string_value') return 'string'
    if (nodeType === 'int_value' || nodeType === 'float_value') return 'number'

    // Punctuation
    if (['{', '}', '(', ')', '[', ']', ':', '!', '|', '&', '@', '...'].includes(nodeType)) {
      return 'punctuation'
    }

    // Names - use semantic info for better classification
    if (nodeType === 'name') {
      if (isOutputField(semantic) || isInputField(semantic)) {
        return 'field-name'
      }
      if (
        semantic instanceof GraphQLObjectType
        || semantic instanceof GraphQLScalarType
        || semantic instanceof GraphQLInterfaceType
      ) {
        return 'type-name'
      }
      if (isVariable(semantic)) {
        return 'variable-name'
      }
      if (isOperation(semantic)) {
        return 'operation-name'
      }
    }

    // Could use TreeSitterGraphQL type guards for better syntax classification:
    // TreeSitterGraphQL.isPunctuationNode(), TreeSitterGraphQL.isKeywordNode(), etc.

    // Variables
    if (nodeType === 'variable') return 'variable'

    return 'text'
  },
}

/*
 * ================================================================================
 * PARSING AND ANALYSIS
 * ================================================================================
 */

async function parseWithTreeSitter(code: string): Promise<WebTreeSitter.Tree> {
  await WebTreeSitter.Parser.init({
    locateFile: (filename: string) => {
      if (filename === 'tree-sitter.wasm') {
        return treeSitterWasmPath
      }
      return filename
    },
  })

  const parser = new WebTreeSitter.Parser()

  const fs = await import('node:fs/promises')
  const wasmBuffer = await fs.readFile(graphqlWasmPath)
  const GraphQL = await WebTreeSitter.Language.load(wasmBuffer)
  parser.setLanguage(GraphQL)

  const tree = parser.parse(code)
  if (!tree) {
    throw new Error('Failed to parse with tree-sitter')
  }

  return tree
}

function collectTreeSitterTokens(tree: WebTreeSitter.Tree): WebTreeSitter.Node[] {
  const tokens: WebTreeSitter.Node[] = []
  const cursor = tree.walk()

  function traverse() {
    const node = cursor.currentNode
    if (!node) return

    // Collect all leaf nodes
    if (node.childCount === 0 && node.text.trim() !== '') {
      tokens.push(node)
    }

    if (cursor.gotoFirstChild()) {
      do {
        traverse()
      } while (cursor.gotoNextSibling())
      cursor.gotoParent()
    }
  }

  traverse()
  return tokens.sort((a, b) => a.startIndex - b.startIndex)
}

function analyzeSemantics(query: string, schema: GraphQLSchema): Map<number, SemanticNode> {
  const ast = parseGraphQL(query)
  const typeInfo = new TypeInfo(schema)
  const semanticMap = new Map<number, SemanticNode>()

  visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      OperationDefinition(node: OperationDefinitionNode) {
        if (node.name && node.name.loc) {
          semanticMap.set(node.name.loc.start, {
            kind: 'Operation',
            type: node.operation,
            name: node.name.value,
          })
        }
      },

      Field(node: FieldNode) {
        const parentType = typeInfo.getParentType()
        const fieldDef = typeInfo.getFieldDef()

        if (node.name.loc && parentType && fieldDef && isObjectType(parentType)) {
          semanticMap.set(node.name.loc.start, {
            kind: 'OutputField',
            parentType,
            fieldDef,
          })
        }
      },

      NamedType(node) {
        const typeName = node.name.value
        const type = schema.getType(typeName)

        if (node.name.loc && type && 'name' in type) {
          semanticMap.set(node.name.loc.start, type as any)
        }
      },

      Variable(node) {
        if (node.name.loc) {
          semanticMap.set(node.name.loc.start - 1, { // -1 for the $
            kind: 'Variable',
            name: node.name.value,
          })
        }
      },
    }),
  )

  return semanticMap
}

function createUnifiedTokens(
  tsTokens: WebTreeSitter.Node[],
  semanticMap: Map<number, SemanticNode>,
): UnifiedToken[] {
  return tsTokens.map(tsNode => {
    // Find semantic node that overlaps this position
    let semantic: SemanticNode | undefined

    for (const [pos, sem] of semanticMap) {
      if (pos >= tsNode.startIndex && pos < tsNode.endIndex) {
        semantic = sem
        break
      }
    }

    return {
      treeSitterNode: tsNode,
      semantic,

      polen: {
        isInteractive: () => polenPlugin.isInteractive(semantic),
        getReferenceUrl: () => polenPlugin.getReferenceUrl(semantic),
      },

      highlighting: {
        getCssClass: () => highlightPlugin.getCssClass(tsNode, semantic),
      },
    }
  })
}

/*
 * ================================================================================
 * MAIN EXECUTION
 * ================================================================================
 */

async function main() {
  console.log('🚀 GraphQL Semantic Joining Sandbox - Refined Version')
  console.log('━'.repeat(80))

  try {
    // Build schema
    const schema = buildSchema(SCHEMA_SDL)

    console.log('📋 Query:')
    console.log(QUERY)
    console.log()

    // Step 1: Tree-sitter parsing
    console.log('🌳 Step 1: Tree-sitter Parsing')
    console.log('━'.repeat(40))
    const tree = await parseWithTreeSitter(QUERY)
    const tsTokens = collectTreeSitterTokens(tree)

    console.log(`Found ${tsTokens.length} tokens`)
    console.table(
      tsTokens.slice(0, 10).map(t => ({
        text: t.text,
        type: t.type,
        parent: t.parent?.type || 'none',
        position: `${t.startIndex}-${t.endIndex}`,
      })),
    )

    // Step 2: GraphQL semantic analysis
    console.log('\n🧠 Step 2: GraphQL Semantic Analysis')
    console.log('━'.repeat(40))
    const semanticMap = analyzeSemantics(QUERY, schema)

    console.log(`Found ${semanticMap.size} semantic nodes`)
    const semanticEntries = Array.from(semanticMap.entries()).slice(0, 10)
    console.table(semanticEntries.map(([pos, node]) => ({
      position: pos,
      kind: 'kind' in node ? node.kind : node.constructor.name,
      details: isOutputField(node)
        ? `${node.parentType.name}.${node.fieldDef.name}`
        : 'name' in node
        ? node.name
        : '-',
    })))

    // Step 3: Create unified tokens
    console.log('\n🔗 Step 3: Creating Unified Tokens')
    console.log('━'.repeat(40))
    const unifiedTokens = createUnifiedTokens(tsTokens, semanticMap)

    console.log('Unified tokens with computed properties:')
    console.table(
      unifiedTokens.slice(0, 15).map(token => ({
        text: token.treeSitterNode.text,
        tsType: token.treeSitterNode.type,
        semanticKind: token.semantic
          ? ('kind' in token.semantic ? token.semantic.kind : token.semantic.constructor.name)
          : 'none',
        interactive: token.polen.isInteractive() ? '✅' : '❌',
        url: token.polen.getReferenceUrl() || '-',
        cssClass: token.highlighting.getCssClass(),
      })),
    )

    // Examples
    console.log('\n📍 Key Examples:')
    console.log('━'.repeat(40))

    const examples = ['GetPokemon', 'pokemon', 'name', 'abilities', 'Pokemon', 'Stats', '$id']

    for (const text of examples) {
      const token = unifiedTokens.find(t => t.treeSitterNode.text === text)
      if (token) {
        console.log(`\n"${text}"`)
        console.log(`  TS type: ${token.treeSitterNode.type}`)
        console.log(`  Semantic: ${
          token.semantic
            ? ('kind' in token.semantic ? token.semantic.kind : token.semantic.constructor.name)
            : 'none'
        }`)
        console.log(`  Interactive: ${token.polen.isInteractive()}`)
        console.log(`  URL: ${token.polen.getReferenceUrl() || 'none'}`)
        console.log(`  CSS: ${token.highlighting.getCssClass()}`)
      }
    }

    console.log('\n💡 Architecture Summary:')
    console.log('━'.repeat(40))
    console.log('1. Tree-sitter nodes provide positions and syntax structure')
    console.log('2. Semantic nodes are either GraphQL classes or our thin wrappers')
    console.log('3. Unified tokens hold references, not copies')
    console.log('4. Plugin functions compute properties on-demand')
    console.log('5. Type discrimination uses instanceof for GraphQL types, kind for our types')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main().catch(console.error)

/**
 * GraphQL AST Mapping Sandbox
 *
 * This sandbox explores how to map between tree-sitter AST and GraphQL package AST
 * to achieve accurate semantic classification for interactive features.
 */

/*
 * ================================================================================
 * IMPORTS AND SETUP
 * ================================================================================
 * Import tree-sitter, GraphQL package, and WASM files needed for dual AST parsing
 * ================================================================================
 */

import { buildSchema, parse as parseGraphQL, validate } from 'graphql'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspect } from 'node:util'
import * as WebTreeSitter from 'web-tree-sitter'

// Get filesystem paths for WASM files when running outside Vite
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../..')

const treeSitterWasmPath = join(projectRoot, 'node_modules', 'web-tree-sitter', 'tree-sitter.wasm')
const graphqlWasmPath = join(projectRoot, 'node_modules', 'tree-sitter-graphql-grammar-wasm', 'grammar.wasm')

/*
 * ================================================================================
 * SAMPLE GRAPHQL DOCUMENTS
 * ================================================================================
 * These are the exact GraphQL documents from Pokemon test-interactive.mdx that
 * contain the problematic cases we need to analyze:
 * - GetPokemon (operation name - should NOT be interactive)
 * - $id (variable name - should NOT be interactive)
 * - Pokemon/ID (type references - SHOULD be interactive)
 * - name/id (field names - SHOULD be interactive)
 * ================================================================================
 */

const SAMPLES = {
  basicQuery: `query GetPokemon($id: ID!) {
  pokemon(id: $id) {
    id
    name
    type
    abilities {
      name
      description
    }
  }
}`,

  fragmentExample: `fragment PokemonDetails on Pokemon {
  id
  name
  type
  stats {
    hp
    attack
    defense
  }
}

query ListPokemons {
  pokemons(limit: 10) {
    ...PokemonDetails
  }
}`,
}

/*
 * ================================================================================
 * POKEMON SCHEMA FOR VALIDATION
 * ================================================================================
 * Simplified Pokemon schema that matches the fields used in our sample documents.
 * This enables GraphQL package validation and semantic analysis to distinguish
 * between actual schema types/fields vs user-defined names like operation names.
 * ================================================================================
 */

const POKEMON_SCHEMA = buildSchema(`
  type Query {
    pokemon(id: ID!): Pokemon
    pokemons(limit: Int): [Pokemon!]!
  }
  
  type Pokemon {
    id: ID!
    name: String!
    type: String!
    abilities: [Ability!]!
    stats: Stats!
  }
  
  type Ability {
    name: String!
    description: String
  }
  
  type Stats {
    hp: Int!
    attack: Int!
    defense: Int!
  }
`)

/*
 * ================================================================================
 * TREE-SITTER PARSER INITIALIZATION
 * ================================================================================
 * Initialize and cache the tree-sitter parser with GraphQL grammar.
 * This gives us precise token positions and syntax tree structure.
 * ================================================================================
 */

let treeSitterParser: WebTreeSitter.Parser | null = null

async function initializeTreeSitter(): Promise<WebTreeSitter.Parser> {
  if (treeSitterParser) return treeSitterParser

  await WebTreeSitter.Parser.init({
    locateFile: (filename: string) => {
      if (filename === 'tree-sitter.wasm') {
        return treeSitterWasmPath
      }
      return filename
    },
  })

  const parser = new WebTreeSitter.Parser()

  // Load GraphQL grammar WASM file from filesystem
  const fs = await import('node:fs/promises')
  const wasmBuffer = await fs.readFile(graphqlWasmPath)
  const GraphQL = await WebTreeSitter.Language.load(wasmBuffer)
  parser.setLanguage(GraphQL)

  treeSitterParser = parser
  return parser
}

/*
 * ================================================================================
 * TREE-SITTER AST ANALYSIS
 * ================================================================================
 * Walk the tree-sitter AST and extract all leaf nodes (actual tokens) with their
 * precise character positions, types, and parent context. This gives us the raw
 * material for syntax highlighting and position mapping.
 * ================================================================================
 */

function nodeToJSON(node: WebTreeSitter.Node, depth: number = 0, maxDepth: number = 500): any {
  if (depth > maxDepth) {
    return { type: node.type, truncated: true, reason: 'max depth reached' }
  }

  // Get field names for children
  const fieldNames: Record<number, string> = {}
  for (let i = 0; i < node.childCount; i++) {
    const fieldName = node.fieldNameForChild(i)
    if (fieldName) {
      fieldNames[i] = fieldName
    }
  }

  // Convert children recursively
  const children: any[] = []
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (child) {
      children.push(nodeToJSON(child, depth + 1, maxDepth))
    }
  }

  return {
    // Core identification
    type: node.type,
    text: node.text,

    // Position information
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    startPosition: {
      row: node.startPosition.row,
      column: node.startPosition.column,
    },
    endPosition: {
      row: node.endPosition.row,
      column: node.endPosition.column,
    },

    // Structure info
    childCount: node.childCount,
    namedChildCount: node.namedChildCount,

    // Internal identifiers (the enums we're interested in)
    id: node.id,
    typeId: node.typeId,

    // State flags (keep useful ones)
    isNamed: node.isNamed,
    hasError: node.hasError,
    isMissing: node.isMissing,
    isExtra: node.isExtra,

    // Relationships (avoid circular references by only including essential info)
    parent: node.parent
      ? {
        type: node.parent.type,
        id: node.parent.id,
      }
      : null,

    nextSibling: node.nextSibling
      ? {
        type: node.nextSibling.type,
        id: node.nextSibling.id,
      }
      : null,

    previousSibling: node.previousSibling
      ? {
        type: node.previousSibling.type,
        id: node.previousSibling.id,
      }
      : null,

    // Field mappings (this could be the key to semantic understanding!)
    fieldNames: Object.keys(fieldNames).length > 0 ? fieldNames : undefined,

    // Children (recursive)
    children: children.length > 0 ? children : undefined,
  }
}

function analyzeTreeSitterAST(code: string, tree: WebTreeSitter.Tree) {
  console.log('\n' + '━'.repeat(80))
  console.log('🌳 TREE-SITTER AST ANALYSIS')
  console.log('━'.repeat(80))

  try {
    // Tree-sitter language info removed due to type errors
    console.log('🔍 Tree-sitter Parser Info:')
    console.log('Parser initialized successfully with GraphQL grammar')

    console.log('\n🔍 Tree-sitter AST (JSON format):')
    console.log(JSON.stringify(nodeToJSON(tree.rootNode, 0, 50), null, 2))

    console.log('\n' + '─'.repeat(40))
    console.log('🔧 Processed Token Analysis (my flattening):')
    console.log('─'.repeat(40))

    const cursor = tree.walk()
    const nodes: Array<{
      text: string
      type: string
      start: number
      end: number
      parent?: string | undefined
    }> = []

    function collectNodes() {
      try {
        const node = cursor.currentNode
        if (!node) return

        // Only collect leaf nodes (actual tokens)
        if (node.childCount === 0 && node.text.trim() !== '') {
          nodes.push({
            text: node.text,
            type: node.type,
            start: node.startIndex,
            end: node.endIndex,
            parent: node.parent?.type,
          })
        }

        if (cursor.gotoFirstChild()) {
          do {
            collectNodes()
          } while (cursor.gotoNextSibling())
          cursor.gotoParent()
        }
      } catch (error) {
        console.log(`⚠️  Error collecting tree-sitter node: ${error}`)
      }
    }

    collectNodes()

    // Sort by position
    nodes.sort((a, b) => a.start - b.start)

    console.log(`📋 Found ${nodes.length} tree-sitter tokens:`)
    const tokenTableData = nodes.map((node, i) => ({
      Index: i,
      Text: `"${node.text}"`,
      Type: node.type,
      Position: `${node.start}-${node.end}`,
      Parent: node.parent || 'none',
    }))
    console.table(tokenTableData)

    return nodes
  } catch (error) {
    console.log(`❌ Tree-sitter AST analysis failed: ${error}`)
    return []
  }
}

/*
 * ================================================================================
 * GRAPHQL PACKAGE AST ANALYSIS
 * ================================================================================
 * Parse the same code with the official GraphQL package to get semantic AST.
 * This gives us proper understanding of what each identifier means in GraphQL
 * terms, plus validation against the schema for type checking.
 * ================================================================================
 */

function extractGraphQLIdentifiers(documentAST: any): Array<{
  Name: string
  Type: string
  Context: string
  Kind: string
}> {
  const identifiers: Array<{
    Name: string
    Type: string
    Context: string
    Kind: string
  }> = []

  function walkAST(node: any, context: string = 'root') {
    if (!node || typeof node !== 'object') return

    // Extract name identifiers with context
    if (node.kind && node.name?.value) {
      identifiers.push({
        Name: node.name.value,
        Type: 'name',
        Context: context,
        Kind: node.kind,
      })
    }

    // Handle variable definitions specially
    if (node.kind === 'Variable' && node.name?.value) {
      identifiers.push({
        Name: `$${node.name.value}`,
        Type: 'variable',
        Context: context,
        Kind: node.kind,
      })
    }

    // Recursively walk all properties
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue // Skip location info

      if (Array.isArray(value)) {
        value.forEach((item, index) => walkAST(item, `${context}.${key}[${index}]`))
      } else if (value && typeof value === 'object') {
        walkAST(value, `${context}.${key}`)
      }
    }
  }

  walkAST(documentAST)
  return identifiers
}

function analyzeGraphQLAST(code: string) {
  console.log('\n' + '━'.repeat(80))
  console.log('📋 GRAPHQL PACKAGE AST ANALYSIS')
  console.log('━'.repeat(80))

  try {
    const documentAST = parseGraphQL(code)
    console.log('🔍 Native GraphQL DocumentNode Structure:')
    console.log(JSON.stringify(documentAST, (key, value) => {
      // Filter out verbose location info to keep output readable
      if (key === 'loc') return '[location info]'
      return value
    }, 2))

    console.log('\n' + '─'.repeat(40))
    console.log('🔧 Processed GraphQL Node Analysis (my flattening):')
    console.log('─'.repeat(40))

    const flattenedNodes = extractGraphQLIdentifiers(documentAST)
    console.table(flattenedNodes)

    // Validate against schema
    console.log('\n' + '─'.repeat(40))
    console.log('🔬 SCHEMA VALIDATION')
    console.log('─'.repeat(40))

    const errors = validate(POKEMON_SCHEMA, documentAST)
    if (errors.length > 0) {
      console.log('❌ Validation errors found:')
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`)
      })
    } else {
      console.log('✅ Document is valid against schema')
    }

    return documentAST
  } catch (error) {
    console.log(`❌ GraphQL parsing failed: ${error instanceof Error ? error.message : error}`)
    console.log('   This might be due to syntax errors in the document')
    return null
  }
}

/*
 * ================================================================================
 * MAPPING EXPERIMENTS
 * ================================================================================
 * This is the core experiment: analyze specific problematic tokens to understand
 * how they appear in both ASTs and develop strategies for accurate semantic
 * classification. Focus on the cases that are currently wrong.
 * ================================================================================
 */

function experimentMapping(treeSitterNodes: any[], graphqlAST: any, code: string) {
  console.log('\n' + '━'.repeat(80))
  console.log('🧪 MAPPING EXPERIMENTS - PROBLEMATIC CASES')
  console.log('━'.repeat(80))

  try {
    // Find specific problematic cases
    const testCases = [
      {
        text: 'GetPokemon',
        description: 'Operation name',
        shouldBeInteractive: false,
        reason: 'operation name, not schema type',
      },
      {
        text: 'ListPokemons',
        description: 'Operation name',
        shouldBeInteractive: false,
        reason: 'operation name, not schema type',
      },
      {
        text: '$id',
        description: 'Variable name',
        shouldBeInteractive: false,
        reason: 'variable name, not schema field',
      },
      { text: 'ID', description: 'Type reference', shouldBeInteractive: true, reason: 'built-in scalar type' },
      { text: 'Pokemon', description: 'Type reference', shouldBeInteractive: true, reason: 'schema type' },
      { text: 'name', description: 'Field name', shouldBeInteractive: true, reason: 'schema field' },
      { text: 'id', description: 'Field name', shouldBeInteractive: true, reason: 'schema field' },
    ]

    console.log('📊 Analyzing critical token cases:')
    const mappingTableData = testCases.map(testCase => {
      try {
        const found = treeSitterNodes.find(n => n.text === testCase.text)
        return {
          Token: testCase.text,
          'Tree-sitter Type': found?.type || 'NOT FOUND',
          Parent: found?.parent || 'N/A',
          'Should be Interactive?': testCase.shouldBeInteractive ? 'YES' : 'NO',
          'Current Status': found
            ? (testCase.shouldBeInteractive ? '🔗 Interactive' : '📝 Non-interactive')
            : '❓ Missing',
          Reason: testCase.reason,
        }
      } catch (error) {
        return {
          Token: testCase.text,
          'Tree-sitter Type': 'ERROR',
          Parent: 'ERROR',
          'Should be Interactive?': testCase.shouldBeInteractive ? 'YES' : 'NO',
          'Current Status': '⚠️ Error',
          Reason: `Error: ${error}`,
        }
      }
    })

    console.table(mappingTableData)

    console.log('\n💡 Key insights needed:')
    console.log('   1. How to distinguish operation names from type names?')
    console.log('   2. How to distinguish variable names from field names?')
    console.log('   3. Can we use GraphQL AST semantic info to classify tree-sitter tokens?')
  } catch (error) {
    console.log(`❌ Mapping experiment failed: ${error}`)
    console.log('   Continuing with other analyses...')
  }
}

/*
 * ================================================================================
 * SAMPLE ANALYSIS PIPELINE
 * ================================================================================
 * For each GraphQL document sample, run it through both parsers and analyze
 * the results side by side. This is where we see the full picture of how the
 * two AST approaches complement each other.
 * ================================================================================
 */

async function analyzeSample(name: string, code: string) {
  console.log(`\n${'█'.repeat(100)}`)
  console.log(`🎯 ANALYZING SAMPLE: ${name.toUpperCase()}`)
  console.log(`${'█'.repeat(100)}`)
  console.log('📄 GraphQL Code:')
  console.log('─'.repeat(50))
  console.log(code)
  console.log('─'.repeat(50))

  try {
    // Parse with tree-sitter
    console.log('\n🔄 Initializing tree-sitter parser...')
    const parser = await initializeTreeSitter()
    const tree = parser.parse(code)

    if (!tree) {
      console.log('❌ Tree-sitter parsing completely failed - no tree returned')
      console.log('   Skipping tree-sitter analysis for this sample')
      return
    }

    console.log('✅ Tree-sitter parsing successful')
    const treeSitterNodes = analyzeTreeSitterAST(code, tree)

    // Parse with GraphQL package
    console.log('\n🔄 Parsing with GraphQL package...')
    const graphqlAST = analyzeGraphQLAST(code)

    // Experiment with mapping strategies
    if (graphqlAST && treeSitterNodes.length > 0) {
      console.log('\n🔄 Running mapping experiments...')
      experimentMapping(treeSitterNodes, graphqlAST, code)
    } else {
      console.log('\n⚠️  Skipping mapping experiments:')
      if (!graphqlAST) console.log('   - GraphQL AST not available')
      if (treeSitterNodes.length === 0) console.log('   - No tree-sitter nodes found')
    }
  } catch (error) {
    console.log(`❌ Sample analysis failed for "${name}": ${error instanceof Error ? error.message : error}`)
    console.log('   Continuing with next sample...')
  }
}

/*
 * ================================================================================
 * MAIN SANDBOX EXECUTION
 * ================================================================================
 * Run the complete analysis pipeline on all sample documents and output
 * comprehensive results for understanding AST mapping strategies.
 * ================================================================================
 */

async function main() {
  console.log('🚀 GraphQL AST Mapping Sandbox')
  console.log('━'.repeat(50))
  console.log('🎯 Goal: Understand how to map tree-sitter tokens to GraphQL semantics')
  console.log('🔍 Focus: Fix incorrect interactive classification of operation names & variables')
  console.log('📊 Method: Compare both AST structures side-by-side')
  console.log('━'.repeat(50))

  let successCount = 0
  let totalSamples = Object.keys(SAMPLES).length

  try {
    // Analyze each sample
    for (const [name, code] of Object.entries(SAMPLES)) {
      try {
        await analyzeSample(name, code)
        successCount++
        console.log(`\n✅ Sample "${name}" completed successfully`)
      } catch (error) {
        console.log(`\n❌ Sample "${name}" failed: ${error instanceof Error ? error.message : error}`)
        console.log('   Continuing with remaining samples...')
      }
    }

    console.log(`\n${'█'.repeat(100)}`)
    console.log('🎯 SANDBOX SUMMARY')
    console.log(`${'█'.repeat(100)}`)
    console.log(`📊 Results: ${successCount}/${totalSamples} samples analyzed successfully`)

    if (successCount > 0) {
      console.log('\n💡 NEXT STEPS:')
      console.log('   1. 📚 Study the AST structures shown above')
      console.log('   2. 🔍 Identify patterns for accurate semantic classification')
      console.log('   3. 🏗️  Design mapping strategy between tree-sitter and GraphQL ASTs')
      console.log('   4. ⚙️  Implement enhanced token classification logic')
      console.log('   5. 🧪 Test with edge cases and complex queries')
    } else {
      console.log('\n❌ No samples were successfully analyzed')
      console.log('   Check error messages above and verify WASM files are accessible')
    }

    console.log(`\n${'█'.repeat(100)}`)
  } catch (error) {
    
    
  }
}

/*
 * ================================================================================
 * SANDBOX EXECUTION
 * ================================================================================
 * Execute the sandbox and handle any errors gracefully.
 * ================================================================================
 */

// Run the sandbox
main().catch(console.error)

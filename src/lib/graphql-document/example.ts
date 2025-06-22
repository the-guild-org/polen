/**
 * Example usage of the GraphQL Document Analysis library
 * 
 * This demonstrates how to use the foundational layer for extracting
 * identifiers and context from GraphQL documents - the building block
 * for the interactive GraphQL Document Component.
 */

import { GraphQLDocument } from './$.ts'

// Example GraphQL query with various constructs
const exampleQuery = `
  query GetPokemonWithAbilities($id: ID!, $limit: Int = 10) {
    pokemon(id: $id) {
      name
      abilities(first: $limit) {
        name
        isHidden
        pokemon {
          name
        }
      }
      ... on ElectricPokemon {
        voltage
      }
    }
  }

  fragment PokemonBasics on Pokemon {
    name
    type
    level
  }
`

/**
 * Demonstrate basic analysis
 */
export const analyzeExample = () => {
  console.log('🔍 Analyzing GraphQL Document...\n')
  
  const result = GraphQLDocument.analyze(exampleQuery)
  
  console.log(`✅ Valid: ${result.isValid}`)
  console.log(`📊 Total identifiers: ${result.identifiers.all.length}`)
  console.log(`🚨 Errors: ${result.errors.length}\n`)

  // Show identifiers by kind
  for (const [kind, identifiers] of result.identifiers.byKind) {
    console.log(`${getKindEmoji(kind)} ${kind} (${identifiers.length}):`)
    for (const identifier of identifiers) {
      const pos = `${identifier.position.line}:${identifier.position.column}`
      const path = identifier.schemaPath.join(' → ')
      const parent = identifier.parentType ? ` (in ${identifier.parentType})` : ''
      console.log(`  • ${identifier.name}${parent} → ${path} @ ${pos}`)
    }
    console.log()
  }

  return result
}

/**
 * Demonstrate identifier lookup by position
 */
export const demonstratePositionLookup = () => {
  console.log('📍 Position-based Identifier Lookup...\n')
  
  const identifiers = GraphQLDocument.extractIdentifiers(exampleQuery)
  
  // Find identifier at a specific position (e.g., cursor position in an editor)
  const targetPosition = 180 // Approximate position of "abilities" field
  
  // Find the closest identifier to this position
  let closestIdentifier = null
  let closestDistance = Infinity
  
  for (const identifier of identifiers.all) {
    const distance = Math.abs(identifier.position.start - targetPosition)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIdentifier = identifier
    }
  }
  
  if (closestIdentifier) {
    console.log(`🎯 Identifier near position ${targetPosition}:`)
    console.log(`   Name: ${closestIdentifier.name}`)
    console.log(`   Kind: ${closestIdentifier.kind}`)
    console.log(`   Schema Path: ${closestIdentifier.schemaPath.join(' → ')}`)
    console.log(`   Context: ${JSON.stringify(closestIdentifier.context, null, 2)}`)
  }
}

/**
 * Demonstrate how this enables hyperlink generation
 */
export const demonstrateHyperlinkGeneration = () => {
  console.log('🔗 Hyperlink Generation Preview...\n')
  
  const identifiers = GraphQLDocument.extractIdentifiers(exampleQuery)
  
  // Show how each identifier could become a hyperlink
  const typeIdentifiers = identifiers.byKind.get('Type') || []
  const fieldIdentifiers = identifiers.byKind.get('Field') || []
  
  console.log('📝 Type References → Schema Links:')
  for (const identifier of typeIdentifiers) {
    const referenceUrl = `/reference/${identifier.name}`
    console.log(`  ${identifier.name} → ${referenceUrl}`)
  }
  
  console.log('\n📝 Field References → Schema Links:')
  for (const identifier of fieldIdentifiers.slice(0, 5)) { // Show first 5
    const referenceUrl = identifier.parentType 
      ? `/reference/${identifier.parentType}#${identifier.name}`
      : `/reference/${identifier.name}`
    console.log(`  ${identifier.name} → ${referenceUrl}`)
  }
}

/**
 * Show the foundation for hover tooltips
 */
export const demonstrateTooltipFoundation = () => {
  console.log('💬 Tooltip Foundation...\n')
  
  const identifiers = GraphQLDocument.extractIdentifiers(exampleQuery)
  
  // Show context information that would be displayed in tooltips
  const fieldIdentifiers = identifiers.byKind.get('Field') || []
  
  for (const identifier of fieldIdentifiers.slice(0, 3)) { // Show first 3
    console.log(`🏷️  ${identifier.name}:`)
    console.log(`    Position: Line ${identifier.position.line}, Column ${identifier.position.column}`)
    console.log(`    Schema Path: ${identifier.schemaPath.join(' → ')}`)
    console.log(`    Parent Type: ${identifier.parentType || 'Root'}`)
    console.log(`    Operation: ${identifier.context.operationType || 'None'}`)
    console.log(`    Selection Path: ${identifier.context.selectionPath.join(' → ')}`)
    console.log()
  }
}

// Helper function
function getKindEmoji(kind: string): string {
  const emojis: Record<string, string> = {
    'Type': '🏷️',
    'Field': '📋',
    'Argument': '⚙️',
    'Variable': '💰',
    'Directive': '🎯',
    'Fragment': '🧩'
  }
  return emojis[kind] || '❓'
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeExample()
  demonstratePositionLookup()
  demonstrateHyperlinkGeneration()
  demonstrateTooltipFoundation()
}
/**
 * Example usage of Schema Integration (Layer 2)
 *
 * Demonstrates how the schema integration layer resolves GraphQL identifiers
 * against actual schemas, extracts documentation, and generates reference URLs.
 */

import { buildSchema } from 'graphql'
import { analyzeWithSchema, createPolenSchemaResolver } from './schema-integration.ts'

// Example schema - typical GraphQL API
const pokemonSchema = buildSchema(`
  """
  A Pokémon character
  """
  type Pokemon {
    """
    The Pokémon's unique identifier
    """
    id: ID!
    
    """
    The Pokémon's name
    """
    name: String!
    
    """
    The Pokémon's type (e.g., Electric, Fire, Water)
    """
    type: String!
    
    """
    The Pokémon's abilities
    """
    abilities(
      """
      Maximum number of abilities to return
      """
      first: Int = 5
    ): [Ability!]!
    
    """
    @deprecated Use evolutionChain instead
    """
    evolutions: [Pokemon!] @deprecated(reason: "Use evolutionChain instead")
  }

  """
  A special ability that Pokémon can have
  """
  type Ability {
    id: ID!
    name: String!
    description: String
    isHidden: Boolean!
  }

  type Query {
    """
    Get a Pokémon by ID
    """
    pokemon(id: ID!): Pokemon
    
    """
    Search for Pokémon by name
    """
    searchPokemon(query: String!): [Pokemon!]!
  }
`)

// Example GraphQL query with various constructs
const exampleQuery = `
  query GetPokemonDetails($pokemonId: ID!, $abilityLimit: Int = 3) {
    pokemon(id: $pokemonId) {
      id
      name
      type
      abilities(first: $abilityLimit) {
        name
        description
        isHidden
      }
      evolutions  # This field is deprecated
      invalidField  # This field doesn't exist
    }
  }
`

/**
 * Demonstrate basic schema resolution
 */
export const demonstrateSchemaResolution = () => {
  console.log('🔗 Schema Integration Demo\n')

  const resolver = createPolenSchemaResolver(pokemonSchema)

  // Example identifiers (normally extracted from AST)
  const testIdentifiers = [
    {
      name: 'Pokemon',
      kind: 'Type' as const,
      position: { start: 50, end: 57, line: 3, column: 5 },
      schemaPath: ['Pokemon'],
      context: { selectionPath: [] },
    },
    {
      name: 'name',
      kind: 'Field' as const,
      position: { start: 75, end: 79, line: 4, column: 7 },
      parentType: 'Pokemon',
      schemaPath: ['Pokemon', 'name'],
      context: { selectionPath: ['pokemon', 'name'] },
    },
    {
      name: 'evolutions',
      kind: 'Field' as const,
      position: { start: 150, end: 160, line: 9, column: 7 },
      parentType: 'Pokemon',
      schemaPath: ['Pokemon', 'evolutions'],
      context: { selectionPath: ['pokemon', 'evolutions'] },
    },
    {
      name: 'first',
      kind: 'Argument' as const,
      position: { start: 120, end: 125, line: 6, column: 20 },
      parentType: 'Pokemon',
      schemaPath: ['Pokemon', 'abilities', 'first'],
      context: { selectionPath: ['pokemon', 'abilities'] },
    },
  ]

  console.log('📋 Identifier Resolutions:\n')

  for (const identifier of testIdentifiers) {
    const resolution = resolver.resolveIdentifier(identifier)
    if (!resolution) continue

    console.log(`🏷️  ${identifier.kind}: ${identifier.name}`)
    console.log(`   ✅ Exists: ${resolution.exists}`)
    console.log(`   🔗 URL: ${resolution.referenceUrl}`)

    if (resolution.documentation) {
      console.log(`   📝 Type: ${resolution.documentation.typeInfo}`)
      if (resolution.documentation.description) {
        console.log(`   💬 Description: ${resolution.documentation.description}`)
      }
      if (resolution.documentation.defaultValue) {
        console.log(`   🎯 Default: ${resolution.documentation.defaultValue}`)
      }
    }

    if (resolution.deprecated) {
      console.log(`   ⚠️  DEPRECATED: ${resolution.deprecated.reason}`)
    }

    console.log()
  }
}

/**
 * Demonstrate full schema-aware analysis
 */
export const demonstrateSchemaAwareAnalysis = () => {
  console.log('🔍 Schema-Aware Analysis\n')

  const result = analyzeWithSchema(exampleQuery, pokemonSchema)

  console.log(`📊 Analysis Summary:`)
  console.log(`   • Valid GraphQL: ${result.analysis.isValid}`)
  console.log(`   • Total identifiers: ${result.analysis.identifiers.all.length}`)
  console.log(`   • Schema resolutions: ${result.resolutions.size}`)
  console.log(`   • Schema errors: ${result.schemaErrors.length}\n`)

  // Show validation errors
  if (result.schemaErrors.length > 0) {
    console.log('🚨 Schema Validation Issues:\n')
    for (const error of result.schemaErrors) {
      const emoji = error.severity === 'error' ? '❌' : '⚠️'
      const pos = `${error.identifier.position.line}:${error.identifier.position.column}`
      console.log(`   ${emoji} ${error.message} @ ${pos}`)
    }
    console.log()
  }

  // Show successful resolutions with hyperlink potential
  console.log('🔗 Generated Hyperlinks:\n')
  let linkCount = 0

  for (const [key, resolution] of result.resolutions) {
    if (resolution.exists && linkCount < 8) { // Show first 8 successful resolutions
      const identifier = result.analysis.identifiers.all.find(id =>
        key.startsWith(`${id.position.start}-${id.name}-${id.kind}`)
      )

      if (identifier) {
        const pos = `${identifier.position.line}:${identifier.position.column}`
        console.log(`   📍 ${identifier.name} (${identifier.kind}) → ${resolution.referenceUrl}`)

        if (resolution.documentation?.description) {
          const shortDesc = resolution.documentation.description.length > 50
            ? resolution.documentation.description.substring(0, 50) + '...'
            : resolution.documentation.description
          console.log(`      💬 "${shortDesc}"`)
        }

        linkCount++
      }
    }
  }
}

/**
 * Demonstrate tooltip data extraction
 */
export const demonstrateTooltipData = () => {
  console.log('\n💬 Tooltip Data Extraction\n')

  const resolver = createPolenSchemaResolver(pokemonSchema)

  // Simulate tooltip hover scenarios
  const tooltipExamples = [
    ['Pokemon'],
    ['Pokemon', 'name'],
    ['Pokemon', 'abilities'],
    ['Pokemon', 'abilities', 'first'],
    ['Ability', 'isHidden'],
  ]

  for (const schemaPath of tooltipExamples) {
    const docs = resolver.getDocumentation(schemaPath)
    if (docs) {
      const pathStr = schemaPath.join(' → ')
      console.log(`🏷️  ${pathStr}`)
      console.log(`   📋 Type: ${docs.typeInfo}`)

      if (docs.description) {
        console.log(`   💬 Description: ${docs.description}`)
      }

      if (docs.defaultValue) {
        console.log(`   🎯 Default: ${docs.defaultValue}`)
      }

      if (docs.deprecated) {
        console.log(`   ⚠️  DEPRECATED: ${docs.deprecated.reason}`)
      }

      console.log()
    }
  }
}

/**
 * Demonstrate URL generation customization
 */
export const demonstrateCustomURLGeneration = () => {
  console.log('🛠️  Custom URL Generation\n')

  // Different resolver configurations
  const configurations = [
    { name: 'Default', config: {} },
    { name: 'Custom Base Path', config: { basePath: '/docs/api' } },
    { name: 'No Fragments', config: { includeFragments: false } },
    { name: 'Custom + No Fragments', config: { basePath: '/schema', includeFragments: false } },
  ]

  const testPaths = [
    ['Pokemon'],
    ['Pokemon', 'name'],
    ['Pokemon', 'abilities', 'first'],
  ]

  for (const { name, config } of configurations) {
    console.log(`📋 ${name}:`)
    const resolver = createPolenSchemaResolver(pokemonSchema, config)

    for (const path of testPaths) {
      const url = resolver.generateReferenceLink(path)
      console.log(`   ${path.join(' → ')} → ${url}`)
    }
    console.log()
  }
}

/**
 * Show integration with Polen's reference system
 */
export const demonstratePolenIntegration = () => {
  console.log('🏗️  Polen Integration Preview\n')

  // This demonstrates how the schema integration connects with Polen's existing systems
  const result = analyzeWithSchema(exampleQuery, pokemonSchema, {
    basePath: '/reference', // Polen's reference page base
    includeFragments: true, // Enable field anchors
  })

  console.log('🔄 How this integrates with Polen:\n')

  console.log('1. 📋 Schema Loading:')
  console.log("   • Uses PROJECT_DATA.schema from Polen's build system")
  console.log('   • Leverages existing schema processing pipeline')
  console.log()

  console.log('2. 🔗 Reference Links:')
  console.log("   • Generates URLs matching Polen's /reference/* structure")
  console.log('   • Works with existing TypeIndex and sidebar system')
  console.log()

  console.log('3. 💬 Documentation:')
  console.log('   • Extracts descriptions for hover tooltips')
  console.log('   • Provides type signatures for context')
  console.log('   • Detects deprecation warnings')
  console.log()

  console.log('4. ✅ Validation:')
  console.log('   • Build-time validation against actual schema')
  console.log('   • Catches typos and invalid references')
  console.log('   • Reports deprecation usage')
  console.log()

  // Show some example integrations
  const validFields = Array.from(result.resolutions.values())
    .filter(r => r.exists)
    .slice(0, 3)

  if (validFields.length > 0) {
    console.log('📋 Example Reference Links:')
    for (const resolution of validFields) {
      console.log(`   • ${resolution.referenceUrl}`)
    }
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateSchemaResolution()
  demonstrateSchemaAwareAnalysis()
  demonstrateTooltipData()
  demonstrateCustomURLGeneration()
  demonstratePolenIntegration()
}

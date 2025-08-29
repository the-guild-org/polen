import { Catalog } from '#lib/catalog/$'
import { Effect } from 'effect'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'

// ============================================================================
// Catalog Storage
// ============================================================================

// Store the catalog data directly in memory
let catalogData: Catalog.Catalog

if (PROJECT_SCHEMA) {
  catalogData = Effect.runSync(Catalog.decode(PROJECT_SCHEMA as any))
}

// ============================================================================
// Bridge API
// ============================================================================

/**
 * Create a simplified catalog bridge without hydra
 */
const createCatalogBridge = () => {
  const assertCatalogLoaded = () => {
    if (!catalogData) {
      throw new Error(
        'No schema catalog available. This page requires a GraphQL schema to be configured. '
          + 'Please ensure your Polen configuration includes a valid schema source.',
      )
    }
  }

  return {
    /**
     * Get the full catalog
     */
    view: () => {
      assertCatalogLoaded()
      return Effect.succeed(catalogData)
    },

    /**
     * Set catalog data
     */
    setData: (data: Catalog.Catalog) => {
      catalogData = data
      return Effect.succeed(undefined)
    },

    /**
     * Add a root value (for compatibility)
     */
    addRootValue: (value: Catalog.Catalog) => {
      catalogData = value
    },

    /**
     * Export to memory (for compatibility)
     */
    exportToMemory: () => {
      if (!catalogData) return []
      // Return as a single JSON blob instead of fragments
      return [{
        filename: 'catalog.json',
        content: JSON.stringify(catalogData, null, 2),
      }]
    },

    /**
     * Export (for compatibility)
     */
    export: () => {
      // No-op in simplified version
      return Effect.succeed(undefined)
    },

    /**
     * Import (for compatibility)
     */
    import: () => {
      // No-op in simplified version - data is already loaded
      return Effect.succeed(undefined)
    },
  }
}

// ============================================================================
// Exported Instance
// ============================================================================

export const catalogBridge = createCatalogBridge()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if catalog data is available
 */
export const hasCatalog = (): boolean => {
  return catalogData !== undefined && catalogData !== null
}

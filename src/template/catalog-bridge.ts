import { Catalog } from '#lib/catalog/$'
import { Hydra } from '#lib/hydra/$'
import { Effect, Match } from 'effect'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'

// ============================================================================
// Catalog Bridge for Progressive Hydration
// ============================================================================

/**
 * Create the IO layer based on the environment
 * - SSR: Use file system IO
 * - Client: Use browser fetch IO
 */
const createIOLayer = () => {
  if (import.meta.env.SSR) {
    // During SSR, we use the File IO layer with the assets directory
    // The path would be configured based on where Vite outputs the assets
    return Hydra.Io.File('.vite/polen-assets/schemas')
  } else {
    // On client, use the Browser IO layer to fetch from the served assets
    const baseUrl = new URL('/assets/schemas/', window.location.origin).toString()
    return Hydra.Io.Browser(baseUrl)
  }
}

/**
 * Create a Catalog Bridge instance
 * This manages the progressive hydration of catalog data
 */
const createCatalogBridge = () => {
  // Create Bridge with appropriate IO layer
  const ioLayer = createIOLayer()

  // Create the Bridge with the Catalog schema
  const bridge = Catalog.Bridge({})

  // Import the dehydrated data from the virtual module if available
  if (PROJECT_SCHEMA) {
    // importFromMemory is synchronous and populates the index
    bridge.importFromMemory(PROJECT_SCHEMA)
  }

  // Return the bridge with IO layer attached
  return {
    bridge,
    ioLayer,

    /**
     * Get the full catalog (deeply hydrated)
     * This provides the IO layer to the effect
     */
    view: () => {
      console.log('Bridge index before view:', bridge.index.fragments)
      return Effect.provide(bridge.view(), ioLayer)
    },

    /**
     * Peek at specific parts of the catalog
     * This provides the IO layer to the effect
     */
    peek: <selection extends Parameters<typeof bridge.peek>[0]>(
      selection: selection,
    ) => Effect.provide(bridge.peek(selection), ioLayer),

    /**
     * Clear the bridge cache
     */
    clear: () => Effect.provide(bridge.clear(), ioLayer),
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global catalog bridge instance
 * In SSR, this will be recreated for each request
 * In browser, this persists across navigation
 */
export const catalogBridge = createCatalogBridge()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if catalog is available
 */
export const hasCatalog = (): boolean => {
  return PROJECT_SCHEMA !== null
}

/**
 * Get catalog type (versioned or unversioned)
 */
export const getCatalogType = async (): Promise<'versioned' | 'unversioned' | 'none'> => {
  if (!hasCatalog()) return 'none'

  try {
    const catalog = await Effect.runPromise(catalogBridge.view())
    return Match.value(catalog).pipe(
      Match.tag('CatalogVersioned', () => 'versioned' as const),
      Match.tag('CatalogUnversioned', () => 'unversioned' as const),
      Match.exhaustive,
    )
  } catch {
    return 'none'
  }
}

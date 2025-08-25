import { Catalog } from '#lib/catalog/$'
import { Hydra } from '#lib/hydra/$'
import { zd, zz } from '#lib/kit-temp/other'
import { Effect, Match } from 'effect'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'

// ============================================================================
// Catalog Bridge for Progressive Hydration
// ============================================================================

/**
 * Create the IO layer based on the environment
 * For now, we'll use Memory IO for both SSR and client
 * TODO: Implement proper progressive hydration with Browser IO
 */
const createIOLayer = () => {
  // Create initial files from the virtual module data
  const initialFiles = new Map<string, string>()

  if (PROJECT_SCHEMA && typeof PROJECT_SCHEMA === 'object') {
    // PROJECT_SCHEMA is now an object mapping filenames to content
    for (const [filename, content] of Object.entries(PROJECT_SCHEMA)) {
      initialFiles.set(filename, content as string)
    }
  }

  return Hydra.Io.Memory({ initialFiles })
}

/**
 * Create a Catalog Bridge instance
 * This manages the progressive hydration of catalog data
 */
const createCatalogBridge = () => {
  // Create IO layer based on the environment (with initial files from virtual module)
  const ioLayer = createIOLayer()

  // Create the Bridge with the Catalog schema
  const bridge = Catalog.Bridge({})

  // Import from IO if data is available
  // z('PROJECT_SCHEMA available:', !!PROJECT_SCHEMA)
  // z('PROJECT_SCHEMA type:', typeof PROJECT_SCHEMA)

  if (PROJECT_SCHEMA && typeof PROJECT_SCHEMA === 'object') {
    // Import data from IO layer (which has the files from PROJECT_SCHEMA)
    Effect.runSync(Effect.provide(bridge.import(), ioLayer))
    console.log('Bridge index after import:')
    // zd(bridge.index.fragments.get('__root__').schema.definition)
    // zd(bridge.index.fragments.get('__root__').schema.definition.getDirective('if'))
    // bridge.index.fragments.__root__
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
      // z('Bridge index before view:', bridge.index.fragments)
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
export const getCatalogType = (): Effect.Effect<'versioned' | 'unversioned' | 'none', never> => {
  if (!hasCatalog()) return Effect.succeed('none')

  return catalogBridge.view().pipe(
    Effect.map(catalog =>
      Match.value(catalog).pipe(
        Match.tag('CatalogVersioned', () => 'versioned' as const),
        Match.tag('CatalogUnversioned', () => 'unversioned' as const),
        Match.exhaustive,
      )
    ),
    Effect.catchAll(() => Effect.succeed('none' as const)),
  )
}

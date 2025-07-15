import PROJECT_SCHEMA_METADATA from 'virtual:polen/project/schema-metadata'
import { createSchemaSource } from '../../api/schema-source/index.js'
import { fetchText } from '../lib/fetch-text.js'
import { polenUrlPathAssets } from '../lib/polen-url.js'

// Create and export the source object directly
export const schemaSource = createSchemaSource({
  io: {
    read: fetchText,
    // No write function provided - will use defaultWriter that throws
  },
  versions: PROJECT_SCHEMA_METADATA.versions,
  assetsPath: polenUrlPathAssets(),
})

// HMR cache invalidation for development
if (import.meta.hot) {
  import.meta.hot.on('polen:schema-invalidate', () => {
    console.log('[HMR] Schema cache invalidated')
    schemaSource.clearCache()

    // Brute force approach: reload the page to ensure fresh data
    // This guarantees all components see the updated schema immediately
    // TODO: When we have reactive data fetching, remove this reload
    //       and let the reactive system handle updates gracefully
    window.location.reload()
  })
}

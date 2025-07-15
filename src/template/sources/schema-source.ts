import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import PROJECT_SCHEMA_METADATA from 'virtual:polen/project/schema-metadata'
import { createSchemaSource } from '../../api/schema-source/index.js'
import { polenUrlPathAssets } from '../lib/polen-url.js'

// Environment-specific IO implementation
const io = import.meta.env.SSR
  ? {
    // Server-side: Read from filesystem
    read: async (path: string) => {
      // Dynamic import to keep fs out of client bundle
      const { readFile } = await import('node:fs/promises')

      // Extract the path after the assets route
      // e.g., "/assets/schemas/latest.json" -> "schemas/latest.json"
      // e.g., "/demos/pokemon/assets/schemas/latest.json" -> "schemas/latest.json"
      const assetsRoute = PROJECT_DATA.server.routes.assets
      // Account for base path in the pattern
      const routePattern = new RegExp(`${assetsRoute}/(.+)$`)
      const match = path.match(routePattern)
      const assetPath = match ? match[1] : path

      // In SSR, we need to read from the correct location
      // During dev, assets are served from Polen's node_modules
      // In production, they're in the build output directory
      let fullPath: string
      if (import.meta.env.DEV) {
        // Development: Read from Polen's Vite cache
        fullPath = `${PROJECT_DATA.paths.framework.devAssets.absolute}/${assetPath}`
      } else {
        // Production: Read from build output
        // The server runs from the project root, and assets are in build/assets/
        fullPath =
          `${PROJECT_DATA.paths.project.relative.build.root}/${PROJECT_DATA.paths.project.relative.build.relative.assets.root}/${assetPath}`
      }

      return readFile(fullPath, 'utf-8')
    },
  }
  : {
    // Client-side: Fetch from HTTP
    read: async (path: string) => {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${path} (${response.status} ${response.statusText})`)
      }
      return response.text()
    },
  }

// Create and export the source object directly
export const schemaSource = createSchemaSource({
  io,
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

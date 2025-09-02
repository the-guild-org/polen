import type { Vite } from '#dep/vite/index'
import type { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'

// ============================================================================
// Types
// ============================================================================

export interface AssetReader<T> {
  read: () => Promise<T> | T
  clear: () => void
}

export interface ReactiveAssetPluginOptions<T> {
  /**
   * Name of the asset type (e.g., 'pages', 'examples', 'schema')
   */
  name: string

  /**
   * Asset reader with cache management
   */
  assetReader: AssetReader<T>

  /**
   * File patterns to watch and check
   */
  filePatterns: {
    /**
     * Paths or patterns to watch for changes
     */
    watch: string[] | (() => string[])
    
    /**
     * Check if a file change is relevant to this asset
     */
    isRelevant: (file: string) => boolean
  }

  /**
   * Virtual modules that depend on this asset data
   */
  dependentVirtualModules: ViteVirtual.Identifier.Identifier[]

  /**
   * Optional hooks for customization
   */
  hooks?: {
    /**
     * Called when data changes. Return true to force full reload.
     */
    onDataChange?: (oldData: T | null, newData: T) => boolean | Promise<boolean>
    
    /**
     * Called when diagnostics are available
     */
    onDiagnostics?: (data: T) => void | Promise<void>
    
    /**
     * Called after successful update
     */
    onAfterUpdate?: (data: T, server: Vite.ViteDevServer) => void | Promise<void>
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Creates a Vite plugin that handles reactive asset updates with cache invalidation
 * and virtual module coordination.
 */
export const ReactiveAssetPlugin = <T>(
  options: ReactiveAssetPluginOptions<T>
): Vite.Plugin => {
  const debug = debugPolen.sub(`vite-reactive:${options.name}`)

  const invalidateVirtualModules = (server: Vite.ViteDevServer) => {
    for (const vm of options.dependentVirtualModules) {
      const module = server.moduleGraph.getModuleById(vm.id)
      if (module) {
        server.moduleGraph.invalidateModule(module)
        debug(`Invalidated virtual module: ${vm.id}`)
      }
    }
  }

  const handleAssetChange = async (
    file: string,
    event: 'add' | 'unlink' | 'change',
    server: Vite.ViteDevServer,
  ): Promise<boolean> => {
    if (!options.filePatterns.isRelevant(file)) return false

    debug(`${options.name} file ${event}: ${file}`)

    // Get old data if we need to compare
    let oldData: T | null = null
    if (options.hooks?.onDataChange) {
      try {
        oldData = await options.assetReader.read()
      } catch {
        // Old data might not exist yet
        oldData = null
      }
    }

    // Clear cache and re-read
    options.assetReader.clear()
    const newData = await options.assetReader.read()

    // Run diagnostics hook if provided
    if (options.hooks?.onDiagnostics) {
      await options.hooks.onDiagnostics(newData)
    }

    // Invalidate all dependent virtual modules
    invalidateVirtualModules(server)

    // Check if full reload is needed
    let needsFullReload = true
    if (options.hooks?.onDataChange) {
      needsFullReload = await options.hooks.onDataChange(oldData, newData)
    }

    // Run after update hook
    if (options.hooks?.onAfterUpdate) {
      await options.hooks.onAfterUpdate(newData, server)
    }

    return needsFullReload
  }

  return {
    name: `polen:reactive-${options.name}`,

    configureServer(server) {
      // Set up file watching
      const watchPaths = typeof options.filePatterns.watch === 'function'
        ? options.filePatterns.watch()
        : options.filePatterns.watch

      for (const path of watchPaths) {
        server.watcher.add(path)
        debug(`Watching ${options.name} path: ${path}`)
      }

      // Handle file additions and deletions
      const handleFileStructureChange = async (file: string, event: 'add' | 'unlink') => {
        const needsFullReload = await handleAssetChange(file, event, server)
        
        if (needsFullReload) {
          debug(`Triggering full reload due to ${event} event`)
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', (file) => handleFileStructureChange(file, 'add'))
      server.watcher.on('unlink', (file) => handleFileStructureChange(file, 'unlink'))
    },

    async handleHotUpdate({ file, server, modules }) {
      const needsFullReload = await handleAssetChange(file, 'change', server)

      if (needsFullReload) {
        debug(`Triggering full reload due to change event`)
        server.ws.send({ type: 'full-reload' })
        return []
      }

      // Allow normal HMR to proceed
      return modules
    },
  }
}
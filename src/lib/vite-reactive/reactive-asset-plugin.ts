import type { Vite } from '#dep/vite/index'
import type { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Cache, Effect } from 'effect'
import * as Path from 'node:path'

// ============================================================================
// Types
// ============================================================================

export interface AssetReader<data, error = never, requirements = never> {
  read: () => Effect.Effect<data, error, requirements>
  clear: () => Effect.Effect<void, never, requirements>
}

export const createAssetReader = <data, error = never, requirements = never>(
  reader: () => Effect.Effect<data, error, requirements>,
): AssetReader<data, error, requirements> => {
  // Use Cache for both caching and concurrent deduplication
  const cacheService = Cache.make({
    capacity: 1,
    timeToLive: Infinity,
    lookup: reader,
  })

  return {
    read: () =>
      Effect.gen(function*() {
        const cache = yield* cacheService
        return yield* cache.get('__constant_key__')
      }),
    clear: () =>
      Effect.gen(function*() {
        const cache = yield* cacheService
        yield* cache.invalidateAll
      }),
  }
}

export interface ReactiveAssetPluginOptions<$Data, E = never, R = never> {
  /**
   * Name of the asset type (e.g., 'pages', 'examples', 'schema')
   */
  name: string

  /**
   * Asset reader with cache management
   */
  reader: AssetReader<$Data, E, R>

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
   * Optional asset emission configuration
   */
  emit?: {
    /**
     * Serializer function that converts data to string content
     * Can return an Effect for async operations (must have FileSystem requirement if needed)
     */
    serializer: (data: Exclude<$Data, null>) => Effect.Effect<string, any, FileSystem.FileSystem> | string
    /**
     * Relative path for the emitted asset (e.g., 'schemas/catalog.json')
     * Used for both dev assets and build assets with appropriate base paths
     */
    path: string
  }
  /**
   * Optional hooks for customization
   */
  hooks?: {
    /**
     * Determines whether a full page reload is needed when data changes.
     * Return true to trigger full browser reload, false for normal HMR.
     */
    shouldFullReload?: (oldData: $Data | null, newData: $Data) => boolean | Promise<boolean>
    /**
     * Called when diagnostics are available
     */
    onDiagnostics?: (data: $Data) => void | Promise<void>
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Creates a Vite plugin that handles reactive asset updates with cache invalidation
 * and virtual module coordination.
 */
export const ReactiveAssetPlugin = <T, E = never, R = never>(
  options: ReactiveAssetPluginOptions<T, E, R>,
): Vite.Plugin => {
  const debug = debugPolen.sub(`vite-reactive:${options.name}`)
  let viteServer: Vite.ViteDevServer | null = null
  let viteConfig: Vite.ResolvedConfig

  const invalidateVirtualModules = (server: Vite.ViteDevServer) => {
    for (const vm of options.dependentVirtualModules) {
      const module = server.moduleGraph.getModuleById(vm.id)
      if (module) {
        server.moduleGraph.invalidateModule(module)
        debug(`Invalidated virtual module: ${vm.id}`)
      }
    }
  }

  // Helper to run the Effect reader with the provided layer
  const runReader = async (reader: () => Effect.Effect<T, E, R>): Promise<T> => {
    const effect = reader()
    // Always provide NodeFileSystem.layer for file system operations
    const finalEffect = effect.pipe(Effect.provide(NodeFileSystem.layer as any))
    return await Effect.runPromise(finalEffect as Effect.Effect<T, E, never>)
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
    if (options.hooks?.shouldFullReload) {
      oldData = await runReader(options.reader.read)
    }

    // Clear cache and re-read
    await Effect.runPromise(
      options.reader.clear().pipe(Effect.provide(NodeFileSystem.layer as any)) as Effect.Effect<void, never, never>,
    )
    const newData = await runReader(options.reader.read)

    // Run diagnostics hook if provided
    if (options.hooks?.onDiagnostics) {
      await options.hooks.onDiagnostics(newData)
    }

    // Invalidate all dependent virtual modules
    invalidateVirtualModules(server)

    // Check if full reload is needed
    let needsFullReload = true
    if (options.hooks?.shouldFullReload) {
      needsFullReload = await options.hooks.shouldFullReload(oldData, newData)
    }

    // Handle asset emission in dev mode
    if (options.emit && viteServer && newData) {
      await Effect.runPromise(
        Effect.gen(function*() {
          // Run the serializer (could be Effect or plain string)
          const serializerResult = options.emit!.serializer(newData as Exclude<T, null>)
          const content = typeof serializerResult === 'string'
            ? serializerResult
            : yield* serializerResult

          // Write to dev assets directory (in Vite's cache dir)
          const devAssetsPath = Path.join(viteConfig.cacheDir, 'assets', options.emit!.path)
          const devAssetsDir = Path.dirname(devAssetsPath)

          // Create directory and write file using Effect's FileSystem
          const fs = yield* FileSystem.FileSystem
          yield* fs.makeDirectory(devAssetsDir, { recursive: true })
          yield* fs.writeFileString(devAssetsPath, content)

          debug(`Dev assets written: ${options.emit!.path}`)
        }).pipe(
          Effect.provide(NodeFileSystem.layer),
        ),
      )
    }

    return needsFullReload
  }

  return {
    name: `polen:reactive-${options.name}`,

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig
    },

    configureServer(server) {
      viteServer = server

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

    async buildStart() {
      // Handle asset emission in build mode
      if (options.emit && !viteServer) {
        // Read the data
        const data = await runReader(options.reader.read)

        if (!data) {
          debug(`No data to emit for ${options.name}`)
          return
        }

        // Run the serializer
        const serializerResult = options.emit.serializer(data as Exclude<T, null>)
        const content = typeof serializerResult === 'string'
          ? serializerResult
          : await Effect.runPromise(
            serializerResult.pipe(
              Effect.provide(NodeFileSystem.layer),
            ),
          )

        // Emit the asset (Vite will place it in the correct output directory)
        this.emitFile({
          type: 'asset',
          fileName: `assets/${options.emit.path}`,
          source: content,
        })

        debug(`Build asset emitted: ${options.emit.path}`)
      }
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

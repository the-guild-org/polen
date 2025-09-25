import { Ef, S } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import type { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Cache } from 'effect'

// ============================================================================
// Types
// ============================================================================

export interface AssetReader<data, error = never, requirements = never> {
  read: () => Ef.Effect<data, error, requirements>
  clear: () => Ef.Effect<void, never, requirements>
}

export const createAssetReader = <data, error = never, requirements = never>(
  reader: () => Ef.Effect<data, error, requirements>,
): AssetReader<data, error, requirements> => {
  // Use Cache for both caching and concurrent deduplication
  const cacheService = Cache.make({
    capacity: 1,
    timeToLive: Infinity,
    lookup: reader,
  })

  return {
    read: () =>
      Ef.gen(function*() {
        const cache = yield* cacheService
        return yield* cache.get('__constant_key__')
      }),
    clear: () =>
      Ef.gen(function*() {
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
    serializer: (data: Exclude<$Data, null>) => Ef.Effect<string, any, FileSystem.FileSystem> | string
    /**
     * Relative path for the emitted asset (e.g., 'schemas/catalog.json')
     * Used for both dev assets and build assets with appropriate base paths
     */
    path: FsLoc.RelFile
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
  const runReader = (reader: () => Ef.Effect<T, E, R>): Ef.Effect<T, E, never> => {
    return reader().pipe(Ef.provide(NodeFileSystem.layer as any)) as Ef.Effect<T, E, never>
  }

  const handleAssetChange = (
    file: string,
    event: 'add' | 'unlink' | 'change',
    server: Vite.ViteDevServer,
  ): Ef.Effect<boolean, never, never> => {
    if (!options.filePatterns.isRelevant(file)) return Ef.succeed(false)

    debug(`${options.name} file ${event}: ${file}`)

    return Ef.gen(function*() {
      // Get old data if we need to compare
      let oldData: T | null = null
      if (options.hooks?.shouldFullReload) {
        oldData = yield* runReader(options.reader.read)
      }

      // Clear cache and re-read
      yield* options.reader.clear().pipe(Ef.provide(NodeFileSystem.layer as any))
      const newData = yield* runReader(options.reader.read)

      // Run diagnostics hook if provided
      if (options.hooks?.onDiagnostics) {
        yield* Ef.tryPromise({
          try: () => Promise.resolve(options.hooks!.onDiagnostics!(newData)),
          catch: (error) => new Error(`Diagnostics hook failed: ${String(error)}`),
        })
      }

      // Invalidate all dependent virtual modules
      invalidateVirtualModules(server)

      // Check if full reload is needed
      let needsFullReload = true
      if (options.hooks?.shouldFullReload) {
        needsFullReload = yield* Ef.tryPromise({
          try: () => Promise.resolve(options.hooks!.shouldFullReload!(oldData, newData)),
          catch: (error) => new Error(`shouldFullReload hook failed: ${String(error)}`),
        })
      }

      // Handle asset emission in dev mode
      if (options.emit && viteServer && newData) {
        yield* Ef.gen(function*() {
          // Run the serializer (could be Effect or plain string)
          const serializerResult = options.emit!.serializer(newData as Exclude<T, null>)
          const content = typeof serializerResult === 'string'
            ? serializerResult
            : yield* serializerResult

          // Write to dev assets directory (in Vite's cache dir)
          const cacheDir = S.decodeSync(FsLoc.AbsDir.String)(viteConfig.cacheDir)
          const assetsDir = FsLoc.join(cacheDir, FsLoc.fromString('assets/'))
          const devAssetsPathLoc = FsLoc.join(assetsDir, options.emit!.path)
          yield* Fs.write(assetsDir, { recursive: true })
          yield* Fs.write(devAssetsPathLoc, content)

          debug(`Dev assets written: ${options.emit!.path}`)
        }).pipe(
          Ef.provide(NodeFileSystem.layer),
        )
      }

      return needsFullReload
    }) as Ef.Effect<boolean, never, never>
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
      const handleFileStructureChange = (file: string, event: 'add' | 'unlink') => {
        Ef.runPromise(
          handleAssetChange(file, event, server).pipe(
            Ef.map((needsFullReload) => {
              if (needsFullReload) {
                debug(`Triggering full reload due to ${event} event`)
                server.ws.send({ type: 'full-reload' })
              }
            }),
          ),
        ).catch(error => {
          console.error(`Error handling ${event} for ${file}:`, error)
        })
      }

      server.watcher.on('add', (file) => handleFileStructureChange(file, 'add'))
      server.watcher.on('unlink', (file) => handleFileStructureChange(file, 'unlink'))
    },

    // Framework boundary: Vite plugin buildStart hook expects Promise return type
    async buildStart() {
      // Handle asset emission in build mode
      if (options.emit && !viteServer) {
        const pluginContext = this
        await Ef.runPromise(
          Ef.gen(function*() {
            // Read the data
            const data = yield* runReader(options.reader.read)

            if (!data) {
              debug(`No data to emit for ${options.name}`)
              return
            }

            // Run the serializer
            const serializerResult = options.emit!.serializer(data as Exclude<T, null>)
            const content = typeof serializerResult === 'string'
              ? serializerResult
              : yield* serializerResult.pipe(
                Ef.provide(NodeFileSystem.layer),
              )

            // Emit the asset (Vite will place it in the correct output directory)
            pluginContext.emitFile({
              type: 'asset',
              fileName: `assets/${options.emit!.path}`,
              source: content,
            })

            debug(`Build asset emitted: ${options.emit!.path}`)
          }),
        )
      }
    },

    // Framework boundary: Vite plugin handleHotUpdate hook expects Promise return type
    async handleHotUpdate({ file, server, modules }) {
      const needsFullReload = await Ef.runPromise(
        handleAssetChange(file, 'change', server),
      )

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

// TODO: MAJOR REFACTOR NEEDED - DRY Principle Violation
// This file shares significant duplicate code patterns with pages.ts:
// - Similar file watching logic
// - Similar cache invalidation patterns
// - Similar virtual module handling
// - Similar diagnostic reporting
// - Similar hot reload triggers
//
// Consider extracting shared functionality into a common base plugin factory
// or shared utilities for:
// - File system watching with cache invalidation
// - Virtual module management
// - Diagnostic collection and reporting
// - Hot reload coordination

import { Examples as ExamplesModule } from '#api/examples/$'
import { generateExampleTypes } from '#api/examples/type-generator'
import type { Api } from '#api/index'
import type { Vite } from '#dep/vite/index'
import { Diagnostic } from '#lib/diagnostic/$'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Cache } from '@wollybeard/kit'
import { Effect } from 'effect'
import * as Path from 'node:path'
import { polenVirtual } from '../vi.js'

const debug = debugPolen.sub(`vite-examples`)

// Using .js extension as a workaround for Rolldown's requirement that virtual modules
// return JavaScript code (export default) rather than pure JSON
export const viProjectExamplesCatalog = polenVirtual([`project`, `data`, `examples-catalog.js`], {
  allowPluginProcessing: true,
})

export interface Options {
  config: Api.Config.Config
  schemaVersions: string[]
}

export interface ProjectExamplesCatalog {
  examples: ExamplesModule.Example[]
}

/**
 * Examples plugin with versioning support
 */
export const Examples = ({
  config,
  schemaVersions,
}: Options): Vite.Plugin => {
  const examplesDir = Path.join(config.paths.project.rootDir, 'examples')

  // Track last generated example names to detect changes
  let lastGeneratedExampleNames: string[] | null = null

  const scanExamples: (() => Promise<ExamplesModule.ScanResult>) & { clear: () => void } = Cache.memoize(
    debug.trace(async function scanExamples(): Promise<ExamplesModule.ScanResult> {
      const result = await Effect.runPromise(
        ExamplesModule.scan({
          dir: examplesDir,
          schemaVersions,
        }).pipe(
          Effect.provide(NodeFileSystem.layer),
        ),
      )

      // Generate TypeScript types if examples have changed
      const currentExampleNames = result.examples.map(e => e.id).sort()
      const exampleNamesChanged = lastGeneratedExampleNames === null
        || currentExampleNames.length !== lastGeneratedExampleNames.length
        || currentExampleNames.some((id, i) => id !== lastGeneratedExampleNames![i])

      if (exampleNamesChanged) {
        debug(`Examples changed, regenerating types`)
        await Effect.runPromise(
          generateExampleTypes(result.examples, config.paths.project.rootDir).pipe(
            Effect.provide(NodeFileSystem.layer),
          ),
        )
        lastGeneratedExampleNames = currentExampleNames
      }

      return result
    }),
  ) as any

  const invalidateVirtualModules = (server: Vite.ViteDevServer) => {
    const catalogModule = server.moduleGraph.getModuleById(viProjectExamplesCatalog.id)
    if (catalogModule) {
      server.moduleGraph.invalidateModule(catalogModule)
      debug(`Invalidated examples catalog virtual module`)
    }
  }

  return {
    name: `polen:examples`,

    // Dev server configuration
    configureServer(server) {
      // Add examples directory to watcher if it exists
      if (examplesDir) {
        debug(`configureServer: watch examples directory`, examplesDir)
        server.watcher.add(examplesDir)

        // Handle file additions and deletions
        const handleFileStructureChange = async (file: string, event: `add` | `unlink`) => {
          if (!file.includes(examplesDir)) return
          if (!file.endsWith('.graphql') && !file.endsWith('.gql')) return

          debug(`Example file ${event === `add` ? `added` : `deleted`}:`, file)

          // Clear cache and rescan
          scanExamples.clear()
          const newScanResult = await scanExamples()

          // Invalidate virtual modules
          invalidateVirtualModules(server)

          // Report any diagnostics
          Diagnostic.report(newScanResult.diagnostics)

          // Trigger full reload to ensure routes are updated
          server.ws.send({ type: `full-reload` })
        }

        server.watcher.on(`add`, (file) => handleFileStructureChange(file, `add`))
        server.watcher.on(`unlink`, (file) => handleFileStructureChange(file, `unlink`))
      }
    },

    // Hot update handling for existing files
    async handleHotUpdate({ file, server }) {
      debug(`handleHotUpdate`, file)
      if (!examplesDir) return
      if (!file.includes(examplesDir)) return
      if (!file.endsWith('.graphql') && !file.endsWith('.gql')) return

      debug(`Example file changed:`, file)

      // Clear cache and rescan
      scanExamples.clear()
      const newScanResult = await scanExamples()

      // Invalidate virtual modules and trigger reload
      invalidateVirtualModules(server)
      Diagnostic.report(newScanResult.diagnostics)
      server.ws.send({ type: `full-reload` })
      return []
    },

    resolveId(id) {
      if (id === viProjectExamplesCatalog.id) {
        return viProjectExamplesCatalog.resolved
      }
    },

    load: {
      async handler(id) {
        if (id !== viProjectExamplesCatalog.resolved) return
        debug(`hook load`)

        const scanResult = await scanExamples()

        Diagnostic.report(scanResult.diagnostics)
        debug(`found examples`, { count: scanResult.examples.length })

        const projectExamplesCatalog: ProjectExamplesCatalog = {
          examples: scanResult.examples,
        }

        // Rolldown requires virtual modules to return JavaScript code with exports,
        // not pure JSON. This is why we use .js extension for the virtual module.
        return `export default ${JSON.stringify(projectExamplesCatalog)}`
      },
    },
  }
}

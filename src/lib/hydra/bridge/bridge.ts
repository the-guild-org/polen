import { S } from '#lib/kit-temp/effect'
import { Context, Effect } from 'effect'
import { Schema } from '../schema/$.js'
import { buildHydratableRegistry, type HydratableRegistry } from '../schema/hydratable-registry.js'
import { buildPathRegistry, type HydratablePathRegistry } from '../schema/hydratables-path-tracking.js'
import { UHL } from '../uhl/$.js'
import { dehydrate } from '../value/dehydrate.js'
import { type BridgeErrors } from './errors.js'
import * as Index from './index.js'
import { IO } from './io/$.js'
import { addHydratablesToIndex } from './operations/add-hydratables-to-index.js'
import { locateHydratedHydratables } from './operations/locate-hydratables.js'
import { Selection } from './selection/$.js'

export interface Options {
  readonly dir?: string
}

export interface Bridge<$Schema extends S.Schema.Any = S.Schema.Any> {
  readonly index: Index.Index
  readonly tree: Schema.HydratablesPathsTree
  readonly registry: HydratableRegistry
  readonly pathRegistry: HydratablePathRegistry

  /**
   * Export all hydratables from index to disk
   */
  readonly export: () => Effect.Effect<void, BridgeErrors>

  /**
   * Export all hydratables from index to memory as [UHL Expression Exported, JSON] pairs
   */
  readonly exportToMemory: () => Array<[string, string]>

  /**
   * Import hydratables from disk into index
   */
  readonly import: () => Effect.Effect<void, BridgeErrors>

  /**
   * Import hydratables from memory into index
   */
  readonly importFromMemory: (data: S.Schema.Type<$Schema>) => void

  /**
   * Clear all assets from disk and reset the in-memory index
   */
  readonly clear: () => Effect.Effect<void, BridgeErrors>

  /**
   * Load assets without hydration - returns possibly dehydrated data
   */
  readonly peek: <
    selection extends Selection.Infer.InferBridgeSelectionFromSchema<$Schema> =
      Selection.Infer.InferBridgeSelectionFromSchema<$Schema>,
  >(
    selection?: selection,
  ) => Effect.Effect<Selection.Infer.InferDehydratedDataFromSelection<$Schema, selection>, BridgeErrors>

  /**
   * Load and hydrate all assets, returning the root data type fully hydrated.
   */
  readonly view: () => Effect.Effect<S.Schema.Type<$Schema>, BridgeErrors>

  /**
   * Dehydrate a value using the bridge's schema.
   * This is a convenience method that uses the same dehydration logic as exportToMemory.
   */
  readonly dehydrate: <value extends S.Schema.Type<$Schema>>(value: value) => unknown
}

export const ContextBridge = Context.GenericTag<Bridge>('@hydra/bridge/Bridge')

/**
 * Creates a bridge factory function for a given schema.
 * The bridge manages hydrated/dehydrated data persistence and retrieval.
 *
 * @param schema - The Effect schema defining the data structure
 * @returns A factory function that creates Bridge instances with the given options
 */
export const makeMake = <schema extends S.Schema.Any>(schema: schema): (options: Options) => Bridge<schema> => {
  return (options) => {
    const index = Index.make()
    const tree = Schema.buildHydratablesPathsTree(schema.ast)
    const registry = buildHydratableRegistry(schema)
    const pathRegistry = buildPathRegistry(tree)
    const dir = options.dir || './'

    const importFromMemory: Bridge<schema>['importFromMemory'] = (data) => {
      const locatedHydratables = locateHydratedHydratables(data, tree)
      addHydratablesToIndex(locatedHydratables, index)
    }

    const import_: Bridge<schema>['import'] = () =>
      Effect.provide(
        Effect.gen(function*() {
          const io = yield* IO.IO
          const entries = yield* io.list('.')
          const jsonFiles = entries.filter(file => file.endsWith('.json'))
          for (const filename of jsonFiles) {
            const uhl = Index.parseFileName(filename)
            const content = yield* io.read(filename)
            const value = JSON.parse(content)
            Index.add(index, uhl, value)
          }
        }),
        IO.File(options.dir || '.'),
      )

    const exportToMemory: Bridge<schema>['exportToMemory'] = () => {
      const result: Array<[string, string]> = []
      const dehydrateWithSchema = dehydrate(schema)

      for (const [uhlExpression, value] of index.data.entries()) {
        const dehydrated = dehydrateWithSchema(value as any)
        const json = JSON.stringify(dehydrated, null, 2)
        const uhlExpressionExported = uhlExpression + '.json'
        result.push([uhlExpressionExported, json])
      }

      return result
    }

    const export_: Bridge<schema>['export'] = () =>
      Effect.provide(
        Effect.gen(function*() {
          const io = yield* IO.IO
          const dehydrateWithSchema = dehydrate(schema)

          // Export all entries from the index to disk
          for (const [key, value] of index.data.entries()) {
            // Use the new dehydrate function
            const dehydrated = dehydrateWithSchema(value as any)

            // Serialize to JSON
            const json = JSON.stringify(dehydrated, null, 2)

            // Write to disk with .json extension
            const filename = Index.indexKeyToFileName(key)
            yield* io.write(filename, json)
          }
        }),
        IO.File(options.dir || '.'),
      )

    const peek: Bridge['peek'] = (selection) =>
      Effect.provide(
        Effect.gen(function*() {
          const io = yield* IO.IO

          // If no selection provided, return empty result (no hydratables selected)
          if (!selection || Object.keys(selection).length === 0) {
            return {} as any
          }

          // Build result object based on selection structure
          const result: Record<string, any> = {}

          // Process each top-level key in the selection
          for (const [tag, selectionValue] of Object.entries(selection)) {
            let uhls: UHL.UHL[]
            try {
              uhls = Selection.toUHL({ [tag]: selectionValue }, pathRegistry)
            } catch (error) {
              // Re-throw the error with Effect.die to preserve the error message
              return Effect.die(error)
            }

            // For each UHL generated from this selection
            for (const uhl of uhls) {
              const indexKey = Index.uhlToIndexKey(uhl)

              // Check index first
              let value = index.data.get(indexKey)

              if (value === undefined) {
                // Not in index, load from disk
                const fileName = Index.indexKeyToFileName(indexKey)
                const filePath = fileName

                const content = yield* io.read(filePath)
                value = JSON.parse(content)

                // Add to index for future access
                Index.add(index, uhl, value)
              }

              // Store in result using the tag as key
              result[tag] = value
            }
          }

          return result as any
        }),
        IO.File(options.dir || '.'),
      )

    const view: Bridge<schema>['view'] = () =>
      Effect.provide(
        Effect.gen(function*() {
          const io = yield* IO.IO

          // Load all hydratables from disk and index
          yield* import_()

          // Handle different root schema types

          // Case 1: Root is a hydratable (has hydratableSegmentTemplate)
          if (tree.hydratableSegmentTemplate) {
            const rootTag = tree.hydratableSegmentTemplate.tag

            // Try to find a matching entry in the index
            for (const [key, value] of index.data.entries()) {
              if (value && typeof value === 'object' && '_tag' in value) {
                const valueTag = (value as any)._tag

                // For ADT members, check if tag matches the pattern
                if (tree.hydratableSegmentTemplate.adt) {
                  if (valueTag.startsWith(tree.hydratableSegmentTemplate.adt)) {
                    return value as S.Schema.Type<schema>
                  }
                } else if (valueTag === rootTag) {
                  return value as S.Schema.Type<schema>
                }
              }
            }

            throw new Error(`No root hydratable found with tag ${rootTag}`)
          }

          // Case 2: Root is a union (like Catalog)
          // Check if any entries in the index match the union schema
          // This handles cases where the root itself is a union of hydratables
          try {
            // Look for the first valid union member in the index
            for (const [key, value] of index.data.entries()) {
              if (value && typeof value === 'object' && '_tag' in value) {
                try {
                  // Attempt to decode with the schema
                  const decoded = S.decodeSync(schema as any)(value)
                  return decoded as S.Schema.Type<schema>
                } catch {
                  // Not a valid member, continue searching
                }
              }
            }
          } catch {
            // Fall through to error
          }

          // No valid data found
          throw new Error(
            'View operation could not find valid data. '
              + 'Ensure the schema is hydratable or a union of hydratables. '
              + 'Consider making your root schema hydratable or use peek() with specific selections.',
          )
        }),
        IO.File(options.dir || '.'),
      )

    const clear: Bridge<schema>['clear'] = () =>
      Effect.provide(
        Effect.gen(function*() {
          const io = yield* IO.IO
          // List all JSON files in the directory
          const entries = yield* io.list('.')
          const jsonFiles = entries.filter(file => file.endsWith('.json'))

          // Remove each JSON file
          for (const filename of jsonFiles) {
            yield* io.remove(filename)
          }

          // Clear the in-memory index
          index.data.clear()
        }),
        IO.File(options.dir || '.'),
      )

    // Create dehydrator once for this schema
    const dehydrateWithSchema = dehydrate(schema)

    const dehydrate_: Bridge<schema>['dehydrate'] = (value) => {
      return dehydrateWithSchema(value)
    }

    return {
      index,
      tree,
      registry,
      pathRegistry,
      import: import_,
      importFromMemory,
      export: export_,
      exportToMemory,
      clear,
      peek,
      view,
      dehydrate: dehydrate_,
    } as Bridge<schema>
  }
}

import { S } from '#lib/kit-temp/effect'
import { Context, Effect } from 'effect'
import { Hydratable } from '../hydratable/$.js'
import { Index } from '../index/$.js'
import { Io } from '../io/$.js'
import { Selection } from '../selection/$.js'
import { Uhl } from '../uhl/$.js'
import { Value } from '../value/$.js'

/**
 * Special filename used to store the root value in bridge persistence
 */
const ROOT_FILENAME = '__root__.json' as const

export interface Options {
  readonly dir?: string
}

export interface Bridge<$Schema extends S.Schema.Any = S.Schema.Any> {
  readonly index: Index.Index
  readonly schemaIndex: Hydratable.ASTIndex

  /**
   * Export all hydratables from index to disk
   */
  readonly export: () => Effect.Effect<void, Error, Io.IOService>

  /**
   * Export all hydratables from index to memory as [UHL Expression Exported, JSON] pairs
   */
  readonly exportToMemory: () => Array<[string, string]>

  /**
   * Import hydratables from disk into index
   */
  readonly import: () => Effect.Effect<void, Error, Io.IOService>

  /**
   * Import hydratables from memory into index
   */
  readonly importFromMemory: (data: S.Schema.Type<$Schema>) => void

  /**
   * Clear all assets from disk and reset the in-memory index
   */
  readonly clear: () => Effect.Effect<void, Error, Io.IOService>

  /**
   * Load assets without hydration - returns possibly dehydrated data
   */
  readonly peek: <
    selection extends Selection.Infer.InferBridgeSelectionFromSchema<$Schema> =
      Selection.Infer.InferBridgeSelectionFromSchema<$Schema>,
  >(
    selection?: selection,
  ) => Effect.Effect<Selection.Infer.InferDehydratedDataFromSelection<$Schema, selection>, Error, Io.IOService>

  /**
   * Load and hydrate all assets, returning the root data type fully hydrated.
   */
  readonly view: () => Effect.Effect<S.Schema.Type<$Schema>, Error, Io.IOService>

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
    const index = Index.create()
    const hydrationContext = Hydratable.createContext(schema)
    const dir = options.dir || '.'

    const importFromMemory: Bridge<schema>['importFromMemory'] = (data) => {
      // Store the root value
      index.root = data

      // Continue to locate and store nested hydratables
      const locatedHydratables = Value.locateHydratedHydratables(data, hydrationContext)
      Index.addHydratablesToIndex(locatedHydratables, index)
    }

    const import_: Bridge<schema>['import'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        const entries = yield* io.list('.')
        const jsonFiles = entries.filter(file => file.endsWith('.json'))

        for (const filename of jsonFiles) {
          if (filename === ROOT_FILENAME) {
            // Special handling for root value
            const content = yield* io.read(filename)
            const value = JSON.parse(content)
            index.root = value
          } else {
            // Regular hydratable handling
            const uhl = Uhl.fromFileName(filename)
            const content = yield* io.read(filename)
            const value = JSON.parse(content)
            index.fragments.set(Uhl.toString(uhl), value)
          }
        }
      })

    const exportToMemory: Bridge<schema>['exportToMemory'] = () => {
      const result: Array<[string, string]> = []
      const dehydrateWithSchema = Value.dehydrate(schema)

      // Export root value if it exists
      if (index.root !== null) {
        const dehydrated = dehydrateWithSchema(index.root as any)
        const json = JSON.stringify(dehydrated, null, 2)
        result.push(['__root__.json', json])
      }

      for (const [uhlExpression, value] of index.fragments.entries()) {
        const dehydrated = dehydrateWithSchema(value as any)
        const json = JSON.stringify(dehydrated, null, 2)
        const uhlExpressionExported = uhlExpression + '.json'
        result.push([uhlExpressionExported, json])
      }

      return result
    }

    const exportToDisk: Bridge<schema>['export'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        const files = exportToMemory()
        yield* Effect.all(
          files.map(([filename, json]) => io.write(filename, json)),
          { concurrency: 'unbounded' },
        )
      })

    const peek: Bridge['peek'] = (selection) =>
      Effect.gen(function*() {
        const io = yield* Io.IO

        // If no selection provided, return empty result (no hydratables selected)
        if (!selection || Object.keys(selection).length === 0) {
          return {} as any
        }

        // Build result object based on selection structure
        type ResultObject = Record<string, any>
        const result: ResultObject = {}

        // Process each top-level key in the selection
        for (const [tag, selectionValue] of Object.entries(selection)) {
          let uhls: Uhl.Uhl[]
          try {
            uhls = Selection.toUHL({ [tag]: selectionValue })
          } catch (error) {
            // Re-throw the error with Effect.die to preserve the error message
            return Effect.die(error)
          }

          // For each UHL generated from this selection
          for (const uhl of uhls) {
            const indexKey = Uhl.toString(uhl)

            // Check index first
            let value = index.fragments.get(indexKey)

            if (value === undefined) {
              // Not in index, load from disk
              const fileName = Uhl.toFileName(uhl)
              const filePath = fileName

              const content = yield* io.read(filePath)
              value = JSON.parse(content)

              // Add to index for future access
              index.fragments.set(Uhl.toString(uhl), value)
            }

            // Store in result using the tag as key
            result[tag] = value
          }
        }

        return result as any
      })

    const view: Bridge<schema>['view'] = () =>
      Effect.gen(function*() {
        // Load all hydratables from disk and index
        yield* import_()

        // Check if root value exists now
        if (index.root === null) {
          throw new Error(
            'View operation could not find root value. '
              + 'Ensure importFromMemory() has been called with valid data.',
          )
        }

        try {
          // Decode and return the root value
          const decoded = S.decodeSync(schema as any)(index.root)
          return decoded as S.Schema.Type<schema>
        } catch (error) {
          throw new Error(
            `Root value exists but failed to decode: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      })

    const clear: Bridge<schema>['clear'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        // List all JSON files in the directory
        const entries = yield* io.list('.')
        const jsonFiles = entries.filter(file => file.endsWith('.json'))

        // Remove each JSON file (including __root__.json)
        for (const filename of jsonFiles) {
          yield* io.remove(filename)
        }

        // Clear the in-memory index
        index.fragments.clear()
        index.root = null
      })

    // Create dehydrator once for this schema
    const dehydrateWithSchema = Value.dehydrate(schema)

    const dehydrate_: Bridge<schema>['dehydrate'] = (value) => {
      return dehydrateWithSchema(value)
    }

    return {
      index,
      schemaIndex: hydrationContext.index,
      import: import_,
      importFromMemory,
      export: exportToDisk,
      exportToMemory,
      clear,
      peek,
      view,
      dehydrate: dehydrate_,
    } as Bridge<schema>
  }
}

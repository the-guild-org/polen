import { Graph } from '#lib/graph/$'
import { EffectKit, S } from '#lib/kit-temp/effect'
import { Context, Effect, Option } from 'effect'
import * as AST from 'effect/SchemaAST'
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

/**
 * Create a dehydrated variant schema for a hydratable tagged struct.
 * The dehydrated variant contains only the tag, _dehydrated flag, and unique keys
 * with their actual encoded types extracted from the hydratable schema.
 */
const createDehydratedVariant = (hydratableSchema: Hydratable.Hydratable): S.Schema.Any => {
  // Extract tag from the schema
  const tag = EffectKit.Schema.TaggedStruct.getTagOrThrow(hydratableSchema)

  // Get hydration config to extract unique keys
  const config = Hydratable.getConfigOrThrow(hydratableSchema)
  const uniqueKeys = config._tag === 'HydratableConfigStruct'
    ? config.uniqueKeys
    : config._tag === 'HydratableConfigSingleton'
    ? ['hash'] // Singleton has synthetic hash key
    : [] // TODO: Handle ADT case when needed

  // Get the encoded schema to extract encoded field types
  const encodedSchema = S.encodedSchema(hydratableSchema)
  const encodedAst = encodedSchema.ast

  const fields: Record<string, S.Schema.Any> = {
    _tag: S.Literal(tag) as unknown as S.Schema.Any,
    _dehydrated: S.Literal(true) as unknown as S.Schema.Any,
  }

  // Handle singleton hydratables specially
  if (config._tag === 'HydratableConfigSingleton') {
    // For singletons, add a hash field as a string
    fields['hash'] = S.String
  } else {
    // Extract the actual encoded types for unique keys
    if (AST.isTypeLiteral(encodedAst)) {
      for (const key of uniqueKeys) {
        const propSig = encodedAst.propertySignatures.find(p => p.name === key)
        if (propSig) {
          // For transformations, we need the 'from' side (encoded type)
          let fieldAst = propSig.type
          if (AST.isTransformation(fieldAst)) {
            fieldAst = fieldAst.from
          }
          // Create schema from the property's AST
          fields[key] = S.make(fieldAst)
        }
      }
    }
  }

  return S.Struct(fields)
}

/**
 * Transform a schema by replacing each hydratable with a union of the original and its dehydrated variant.
 * This allows the schema to naturally handle both hydrated and dehydrated values during decoding.
 *
 * TODO: Currently only supports hydratable tagged structs. Union types would require creating
 * a dehydrated variant for each member, which adds complexity.
 */
const transformSchemaWithHydratables = (
  ast: AST.AST,
  hydrationContext: Hydratable.Context,
): AST.AST => {
  // Helper to check if an AST node represents a hydratable
  const isHydratableAst = (node: AST.AST): boolean => {
    // Check various ways an AST might represent a hydratable

    // 1. Direct reference - the AST is exactly a hydratable AST
    for (const [tag, hydratableAst] of hydrationContext.index) {
      if (node === hydratableAst) {
        return true
      }
    }

    // 2. Declaration reference - the AST has an identifier that matches a hydratable
    if ('_id' in node && typeof node._id === 'string') {
      // Check if this identifier corresponds to a hydratable
      for (const [tag, hydratableAst] of hydrationContext.index) {
        if ('_id' in hydratableAst && node._id === hydratableAst._id) {
          return true
        }
      }
    }

    // 3. Check if it's a TypeLiteral with a tag that matches a hydratable
    if (AST.isTypeLiteral(node)) {
      const tagField = node.propertySignatures.find(f => f.name === '_tag')
      if (tagField && AST.isLiteral(tagField.type)) {
        const tag = tagField.type.literal as string
        return hydrationContext.index.has(tag)
      }
    }

    return false
  }

  const transform = (node: AST.AST): AST.AST => {
    // Check if this is a hydratable reference (not the hydratable itself being defined)
    if (isHydratableAst(node)) {
      // Get the tag to identify which hydratable this is
      let tag: string | undefined

      // Try different ways to get the tag
      for (const [hydratableTag, hydratableAst] of hydrationContext.index) {
        if (
          node === hydratableAst
          || ('_id' in node && '_id' in hydratableAst && node._id === hydratableAst._id)
        ) {
          tag = hydratableTag
          break
        }
      }

      // If it's a TypeLiteral, get tag from the field
      if (!tag && AST.isTypeLiteral(node)) {
        const tagField = node.propertySignatures.find(f => f.name === '_tag')
        if (tagField && AST.isLiteral(tagField.type)) {
          tag = tagField.type.literal as string
        }
      }

      if (tag && hydrationContext.index.has(tag)) {
        // This is a reference to a hydratable - create a union with its dehydrated variant
        const hydratableSchema = S.make(node)
        const dehydratedSchema = createDehydratedVariant(hydratableSchema as unknown as Hydratable.Hydratable)
        const unionSchema = S.Union(dehydratedSchema, hydratableSchema)
        return unionSchema.ast
      }
    }
    switch (node._tag) {
      case 'TypeLiteral': {
        // Transform all properties recursively
        // Properties that reference hydratables will be transformed to unions
        return new AST.TypeLiteral(
          node.propertySignatures.map(sig => {
            const transformedType = transform(sig.type)
            return new AST.PropertySignature(
              sig.name,
              transformedType,
              sig.isOptional,
              sig.isReadonly,
              sig.annotations,
            )
          }),
          node.indexSignatures.map(sig =>
            new AST.IndexSignature(
              sig.parameter,
              transform(sig.type),
              sig.isReadonly,
            )
          ),
          node.annotations,
        )
      }

      case 'Union':
        // Transform each member of the union
        const transformedTypes = node.types.map(transform)
        // If any types were transformed, we need to recreate the union
        if (transformedTypes.some((t, i) => t !== node.types[i])) {
          // Create schemas from each AST and union them
          const schemas = transformedTypes.map(ast => S.make(ast))
          const unionSchema = schemas.reduce((acc, schema) => acc ? S.Union(acc, schema) : schema)
          return unionSchema?.ast || node
        }
        return node

      case 'TupleType':
        // Transform tuple elements
        // Transform tuple elements
        return new AST.TupleType(
          node.elements.map(element =>
            new AST.OptionalType(
              transform(element.type),
              element.isOptional,
              element.annotations,
            )
          ),
          node.rest.map(rest =>
            new AST.Type(
              transform(rest.type),
              rest.annotations,
            )
          ),
          node.isReadonly,
        )

      case 'Transformation':
        // For transformations, we need to transform the 'to' side
        // since that's what the decoder will work with
        return new AST.Transformation(
          node.from,
          transform(node.to),
          node.transformation,
        )

      case 'Suspend':
        // For suspended schemas, transform the resolved schema
        return new AST.Suspend(() => transform(node.f()))

      case 'Refinement':
        // Transform the underlying schema
        return new AST.Refinement(transform(node.from), node.filter, node.annotations)

      case 'Declaration':
        // Declarations are references to other schemas
        // Check if this declaration references a hydratable
        const typeParameters = node.typeParameters.map(transform)

        // Transform the declaration to see if it resolves to a hydratable
        const transformedDeclaration = new AST.Declaration(
          typeParameters,
          (...args: any) => node.decodeUnknown(...args),
          (...args: any) => node.encodeUnknown(...args),
        )

        // Also check if the declaration itself is a hydratable reference
        if (isHydratableAst(node)) {
          // This declaration references a hydratable - create a union
          const hydratableSchema = S.make(node)
          const dehydratedSchema = createDehydratedVariant(hydratableSchema as unknown as Hydratable.Hydratable)
          const unionSchema = S.Union(dehydratedSchema, hydratableSchema)
          return unionSchema.ast
        }

        return transformedDeclaration

      default:
        // For other AST types (literals, primitives, etc.), return as-is
        return node
    }
  }

  return transform(ast)
}

export interface Options {
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
 * Convert in-memory data to bridge file format.
 * This is useful for testing or initializing a bridge with data.
 *
 * @param data - The fully hydrated data to convert
 * @param schema - The schema for the data
 * @returns Array of [filename, json content] pairs
 */
export const dataToFiles = <schema extends S.Schema.Any>(
  data: S.Schema.Type<schema>,
  schema: schema,
): Array<[string, string]> => {
  const hydrationContext = Hydratable.createContext(schema)
  const result: Array<[string, string]> = []

  // Handle root value
  const dehydrationResult = Value.dehydrateWithDependenciesAndContext(data, hydrationContext)
  const rootJson = JSON.stringify(dehydrationResult.value, null, 2)
  result.push([ROOT_FILENAME, rootJson])

  // Locate and export all hydratables
  const locatedHydratables = Value.locateHydratedHydratables(data, hydrationContext)
  for (const located of locatedHydratables) {
    const uhl = Uhl.toString(located.uhl)
    const fragmentToExport = Value.encodeFragmentForExport(located.value, hydrationContext)
    const json = JSON.stringify(fragmentToExport, null, 2)
    result.push([uhl + '.json', json])
  }

  return result
}

/**
 * Creates a bridge factory function for a given schema.
 * The bridge manages hydrated/dehydrated data persistence and retrieval.
 *
 * @param schema - The Effect schema defining the data structure
 * @returns A factory function that creates Bridge instances with the given options
 */
export const makeMake = <schema extends S.Schema.Any>(schema: schema): (options?: Options) => Bridge<schema> => {
  return () => {
    const index = Index.create()
    const hydrationContext = Hydratable.createContext(schema)
    // We'll create the decoder after transformation
    let decode: (u: unknown) => S.Schema.Type<schema>

    // Create dehydrator from original schema before transformation
    const dehydrate = Value.dehydrate(schema)
    const dehydrateWithDeps = Value.dehydrateWithDependencies(schema)

    // Transform the schema to handle hydratables as unions
    const transformedAst = transformSchemaWithHydratables(schema.ast, hydrationContext)
    const transformedSchema = S.make(transformedAst)

    // Create decoder from transformed schema
    // @ts-expect-error - Schema context type mismatch
    decode = S.decodeSync(transformedSchema)

    const importFromMemory: Bridge<schema>['importFromMemory'] = (data) => {
      // Store the root value
      index.root = data

      // Continue to locate and store nested hydratables
      const locatedHydratables = Value.locateHydratedHydratables(data, hydrationContext)
      Index.addHydratablesToIndex(locatedHydratables, index)

      // Dehydrate with dependencies to build the graph
      const dehydrationResult = dehydrateWithDeps(data as any)
      index.graph = dehydrationResult.graph

      // Mark as imported
      index.hasImported = true
    }

    const importFromIo: Bridge<schema>['import'] = () =>
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

        // Mark as imported after successful load
        index.hasImported = true
      })

    const exportToMemory: Bridge<schema>['exportToMemory'] = () => {
      const result: Array<[string, string]> = []

      // Export root value if it exists
      if (index.root !== null) {
        const dehydrationResult = Value.dehydrateWithDependenciesAndContext(index.root, hydrationContext)
        const json = JSON.stringify(dehydrationResult.value, null, 2)
        result.push(['__root__.json', json])

        // Update the graph in the index
        index.graph = dehydrationResult.graph
      }

      for (const [uhlExpression, value] of index.fragments.entries()) {
        // Fragments should be shallow hydrated - encode but don't dehydrate the fragment itself
        const fragmentToExport = Value.encodeFragmentForExport(value, hydrationContext)
        const json = JSON.stringify(fragmentToExport, null, 2)
        const uhlExpressionExported = uhlExpression + '.json'
        result.push([uhlExpressionExported, json])
      }

      return result
    }

    const exportToIo: Bridge<schema>['export'] = () =>
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
            const uhlString = Uhl.toString(uhl)

            // Load from disk - contains the encoded fragment (shallow hydrated)
            const fileName = Uhl.toFileName(uhl)
            const filePath = fileName

            let value: any
            try {
              const content = yield* io.read(filePath)
              const encodedFragment = JSON.parse(content)

              // The fragment is already in the correct form (shallow hydrated)
              // We just need to parse the JSON
              value = encodedFragment
            } catch (error) {
              // File not found or parse error - return error
              return yield* Effect.fail(
                new Error(
                  `Failed to load hydratable at ${uhlString}: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                ),
              )
            }

            // Check if we need to handle deep selection
            const isDeepSelection = typeof selectionValue === 'object' && selectionValue !== null
              && Object.keys(selectionValue).some(k => k.startsWith('$'))

            if (isDeepSelection) {
              // For deep selections, we need to recursively process child selections
              const childSelections = Object.entries(selectionValue as Record<string, any>)
                .filter(([k]) => k.startsWith('$'))
                .map(([k, v]) => ({ [k.slice(1)]: v }))

              // Process child selections recursively
              for (const childSelection of childSelections) {
                const childResult = yield* peek(childSelection as any)
                // Merge child results into the main result
                Object.assign(result as any, childResult as any)
              }

              // Store the hydrated parent value
              result[tag] = value
            } else {
              // For shallow selections, return the hydrated value directly
              result[tag] = value
            }
          }
        }

        return result as any
      })

    const view: Bridge<schema>['view'] = () =>
      Effect.gen(function*() {
        // Only import if not already imported
        if (!index.hasImported) {
          yield* importFromIo()
        }

        // Check if root value exists now
        if (index.root === null) {
          throw new Error(
            'View operation could not find root value. '
              + 'Ensure importFromMemory() has been called with valid data.',
          )
        }

        // Hydrate the root value fully before returning
        const hydrated = Value.hydrate(index.root, index)

        // The hydrated value is already in decoded form, so we can return it directly
        // The transformed schema is used for peek/partial hydration scenarios
        return hydrated as S.Schema.Type<schema>
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
        index.hasImported = false
        index.graph = Graph.create()
      })

    return {
      index,
      schemaIndex: hydrationContext.index,
      import: importFromIo,
      importFromMemory,
      export: exportToIo,
      exportToMemory,
      clear,
      peek,
      view,
      dehydrate,
    } as Bridge<schema>
  }
}

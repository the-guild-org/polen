import { Graph } from '#lib/graph/$'
import type { FragmentAsset } from '#lib/hydra/fragment-asset'
import { EffectKit, S } from '#lib/kit-temp/effect'
import { Context, Effect } from 'effect'
import * as AST from 'effect/SchemaAST'
import { Hydratable } from '../hydratable/$.js'
import { Index } from '../index/$.js'
import { Io } from '../io/$.js'
import { Selection } from '../selection/$.js'
import { Uhl } from '../uhl/$.js'
import { Value } from '../value/$.js'

// Root is now stored as a regular fragment with UHL key '__root__'

/**
 * Create a dehydrated variant schema for a hydratable tagged struct.
 * The dehydrated variant contains only the tag, _dehydrated flag, and unique keys
 * with their actual encoded types extracted from the hydratable schema.
 */
const createDehydratedVariant = <$Schema extends Hydratable.Hydratable>(
  hydratableSchema: $Schema,
): any => { // Using any to avoid complex type constraints
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

  return S.Struct(fields) as any // Cast to any to avoid complex type constraints
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
    for (const [tag, hydratableAst] of hydrationContext.astIndex) {
      if (node === hydratableAst) {
        return true
      }
    }

    // 2. Declaration reference - the AST has an identifier that matches a hydratable
    if ('_id' in node && typeof node._id === 'string') {
      // Check if this identifier corresponds to a hydratable
      for (const [tag, hydratableAst] of hydrationContext.astIndex) {
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
        return hydrationContext.astIndex.has(tag)
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
      for (const [hydratableTag, hydratableAst] of hydrationContext.astIndex) {
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

      if (tag && hydrationContext.astIndex.has(tag)) {
        // This is a reference to a hydratable in a property - create a union with its dehydrated variant
        // The dehydrated variant comes second so hydrated is preferred during decoding
        const hydratableSchema = S.make(node)
        const dehydratedSchema = createDehydratedVariant(hydratableSchema as unknown as Hydratable.Hydratable)
        const unionSchema = S.Union(hydratableSchema, dehydratedSchema)
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
        return new AST.Suspend(() => {
          const resolvedAst = node.f()
          const transformedResolved = transform(resolvedAst)

          // Check if the resolved AST is a hydratable
          if (AST.isTypeLiteral(resolvedAst)) {
            const tagField = resolvedAst.propertySignatures.find(f => f.name === '_tag')
            if (tagField && AST.isLiteral(tagField.type)) {
              const tag = tagField.type.literal as string
              if (hydrationContext.astIndex.has(tag)) {
                // This suspended schema resolves to a hydratable
                // Create a union with its dehydrated variant
                const hydratableSchema = S.make(transformedResolved)
                const dehydratedSchema = createDehydratedVariant(hydratableSchema as unknown as Hydratable.Hydratable)
                const unionSchema = S.Union(hydratableSchema, dehydratedSchema)
                return unionSchema.ast
              }
            }
          }

          return transformedResolved
        })

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

/**
 * A fragment exported to memory with filename and JSON content
 */
export interface ExportedFragment {
  readonly filename: string
  readonly content: string
}

export interface Bridge<$Schema extends S.Schema.Any = S.Schema.Any> {
  readonly index: Index.Index
  readonly schemaIndex: Hydratable.ASTIndex

  /**
   * Export all hydratables from index to disk
   */
  readonly export: () => Effect.Effect<void, Error, Io.IOService>

  /**
   * Export all hydratables from index to memory as exported fragments
   */
  readonly exportToMemory: () => ExportedFragment[]

  /**
   * Import hydratables from disk into index
   */
  readonly import: () => Effect.Effect<void, Error, Io.IOService>

  /**
   * Import hydratables from memory into index
   */
  readonly addRootValue: (data: S.Schema.Type<$Schema>) => void

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
export const makeMake = <schema extends S.Schema.Any>(schema: schema): (options?: Options) => Bridge<schema> => {
  return () => {
    const index = Index.create()

    // Transform the schema to handle hydratables as unions
    const baseContext = Hydratable.createContext(schema)
    const transformedAst = transformSchemaWithHydratables(schema.ast, baseContext)
    const transformedSchema = S.make(transformedAst)

    // Create transformed schemas for each hydratable type as well
    const transformedAstIndex = new Map<string, S.Schema.Any>()
    for (const [tag, ast] of baseContext.astIndex) {
      const transformedHydratableAst = transformSchemaWithHydratables(ast, baseContext)
      const transformedSchema = S.make(transformedHydratableAst)
      transformedAstIndex.set(tag, transformedSchema)
    }

    // Create hydration context with transformed schema
    const hydrationContext: Hydratable.Context = {
      ...baseContext,
      transformedSchema,
      transformedAstIndex,
    }

    const addRootValue: Bridge<schema>['addRootValue'] = (rootValue) => {
      Index.addRootValue(index, rootValue, hydrationContext)
    }

    const importFromIo: Bridge<schema>['import'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        const entries = yield* io.list('.')
        const jsonFiles = entries.filter(file => file.endsWith('.json'))

        // Read all files first
        const fragmentAssets: FragmentAsset[] = []
        for (const filename of jsonFiles) {
          const content = yield* io.read(filename)
          // zz('content', content)
          fragmentAssets.push({ filename, content })
        }

        Index.addFragmentAssets(fragmentAssets, index, hydrationContext)
      })

    const exportToMemory: Bridge<schema>['exportToMemory'] = () => {
      const fragmentAssets = Index.toFragmentAssets(index, hydrationContext)
      return fragmentAssets
    }

    const exportToIo: Bridge<schema>['export'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        const exportedFragments = exportToMemory()
        yield* Effect.all(
          exportedFragments.map(({ filename, content }) => io.write(filename, content)),
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
        // todo: Only import if not already imported
        yield* importFromIo()

        // Check if root value exists now
        const rootValue = Index.getRootValue(index)
        if (rootValue === null) {
          throw new Error(
            'View operation could not find root value. '
              + 'Ensure importFromMemory() has been called with valid data.',
          )
        }

        // Hydrate the root value fully before returning
        const hydrated = Value.hydrate(rootValue, index)

        // Both import paths now store decoded data:
        // - importFromDisk: decoded during fragment import
        // - importFromMemory: stored decoded as-is
        return hydrated as S.Schema.Type<schema>
      })

    const clear: Bridge<schema>['clear'] = () =>
      Effect.gen(function*() {
        const io = yield* Io.IO
        // List all JSON files in the directory
        const entries = yield* io.list('.')
        const jsonFiles = entries.filter(file => file.endsWith('.json'))

        // Remove each JSON file
        for (const filename of jsonFiles) {
          yield* io.remove(filename)
        }

        // Clear the in-memory index
        index.fragments.clear()
        index.graph = Graph.create()
      })

    const dehydrate = Value.dehydrate(schema)

    return {
      index,
      schemaIndex: hydrationContext.astIndex,
      import: importFromIo,
      addRootValue,
      export: exportToIo,
      exportToMemory,
      clear,
      peek,
      view,
      dehydrate,
    } as Bridge<schema>
  }
}

import type { Config } from '#api/config/normalized'
import { Augmentations } from '#api/schema/augmentations/$'
import { type CategoryConfig, processCategoriesWithVersion } from '#api/schema/categories-processor'
import type { InputSourceError } from '#api/schema/input-source/errors'
import type { EffectInputSource, InputSource } from '#api/schema/input-source/input-source'
import * as InputSourceLoader from '#api/schema/input-source/load'
import { InputSources } from '#api/schema/input-sources/$'
import { Catalog } from '#lib/catalog/$'
import type { PlatformError } from '@effect/platform/Error'
import type { FileSystem } from '@effect/platform/FileSystem'
import { Arr } from '@wollybeard/kit'
import { Effect } from 'effect'

// For now, we'll need a type that accepts both promise and effect sources
type AnyInputSource = InputSource | EffectInputSource

/**
 * Find the first applicable source for the given config.
 * Returns the source and its config, or null if none found.
 */
const findApplicableSource = (
  config: Config,
): Effect.Effect<
  {
    source: AnyInputSource
    sourceConfig: object
  } | null,
  PlatformError | InputSourceError,
  FileSystem
> =>
  Effect.gen(function*() {
    if (config.schema?.enabled === false) return null

    const allSources: AnyInputSource[] = [
      InputSources.VersionedDirectory.loader,
      InputSources.Directory.loader,
      InputSources.File.loader,
      InputSources.Memory.loader,
      InputSources.Introspection.loader,
      InputSources.IntrospectionFile.loader,
    ] as AnyInputSource[]

    const useFirst = config.schema?.useSources
      ? Arr.sure(config.schema.useSources)
      : null

    const context: InputSourceLoader.Context = { paths: config.paths }

    const sourcesToTry = useFirst
      ? useFirst.map(name => allSources.find(s => s.name === name)).filter(Boolean) as AnyInputSource[]
      : allSources

    for (const source of sourcesToTry) {
      const sourceConfig = (config.schema?.sources as any)?.[source.name] ?? {}

      // Check if this is an Effect-based source by checking the source type
      const isEffectSource = (source as any).__effectInputSource === true

      let isApplicable: boolean

      if (isEffectSource) {
        // It's an Effect-based source
        const effectSource = source as EffectInputSource
        isApplicable = yield* effectSource.isApplicable(sourceConfig, context)
      } else {
        // It's a promise-based source
        const promiseSource = source as InputSource
        isApplicable = yield* Effect.promise(() => promiseSource.isApplicable(sourceConfig, context))
      }

      if (isApplicable) {
        return {
          source: source as any,
          sourceConfig,
        }
      }
    }

    return null
  })

/**
 * Check if a schema exists using the configured sources.
 * Returns true if any source has a schema, false otherwise.
 */
export const hasSchema = (config: Config): Effect.Effect<boolean, PlatformError | InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    const source = yield* findApplicableSource(config)
    return source !== null
  })

/**
 * Load schema without throwing if none found.
 * Returns null if no schema is configured or found.
 */
export const loadOrNull = (
  config: Config,
): Effect.Effect<InputSourceLoader.LoadedCatalog | null, PlatformError | InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    if (config.schema?.enabled === false) return null

    const applicable = yield* findApplicableSource(config)
    if (!applicable) {
      return null
    }

    const context: InputSourceLoader.Context = { paths: config.paths }

    // Check if this is an Effect-based source by checking the source type
    const isEffectSource = (applicable.source as any).__effectInputSource === true

    let catalog: Catalog.Catalog | null

    if (isEffectSource) {
      // It's an Effect-based source
      const effectSource = applicable.source as EffectInputSource
      catalog = yield* effectSource.readIfApplicableOrThrow(
        applicable.sourceConfig,
        context,
      )
    } else {
      // It's a promise-based source
      const promiseSource = applicable.source as InputSource
      catalog = yield* Effect.promise(() =>
        promiseSource.readIfApplicableOrThrow(
          applicable.sourceConfig,
          context,
        )
      )
    }

    if (!catalog) {
      return null
    }

    const loadedSchema: InputSourceLoader.LoadedCatalog = {
      data: catalog,
      source: applicable.source as InputSource,
    }

    // Apply augmentations if configured and catalog was loaded
    if (loadedSchema.data && config.schema?.augmentations) {
      const augmentations = config.schema.augmentations
      const catalog = loadedSchema.data as Catalog.Catalog
      const allDiagnostics: Augmentations.Diagnostic[] = []

      Catalog.fold(
        (versioned) => {
          for (const schema of Catalog.Versioned.getAll(versioned)) {
            const { diagnostics } = Augmentations.applyAll(
              schema.definition,
              augmentations,
              schema.version,
            )
            allDiagnostics.push(...diagnostics)
          }
        },
        (unversioned) => {
          const { diagnostics } = Augmentations.applyAll(
            unversioned.schema.definition,
            augmentations,
            null,
          )
          allDiagnostics.push(...diagnostics)
        },
      )(catalog)

      // Add diagnostics to loaded schema if any were generated
      if (allDiagnostics.length > 0) {
        loadedSchema.diagnostics = allDiagnostics
      }
    }

    // Apply categories if configured and catalog was loaded
    if (loadedSchema.data && config.schema?.categories) {
      const categoriesConfig = config.schema.categories
      const catalog = loadedSchema.data as Catalog.Catalog

      Catalog.fold(
        (versioned) => {
          // For versioned catalogs, apply categories per version
          for (const schema of Catalog.Versioned.getAll(versioned)) {
            const versionString = schema.version?.toString()
            const categories = processCategoriesWithVersion(
              schema.definition,
              categoriesConfig as CategoryConfig[] | Record<string, CategoryConfig[]>,
              versionString,
            ) // Update the schema's categories field
            ;(schema as any).categories = categories
          }
        },
        (unversioned) => {
          // For unversioned catalogs, apply categories directly
          const categories = processCategoriesWithVersion(
            unversioned.schema.definition,
            categoriesConfig as CategoryConfig[] | Record<string, CategoryConfig[]>,
            undefined,
          ) // Update the schema's categories field
          ;(unversioned.schema as any).categories = categories
        },
      )(catalog)
    }

    return loadedSchema
  })

/**
 * High-level schema loader that handles all configuration and source assembly.
 *
 * This function:
 * - Creates InputSource instances for all available sources
 * - Determines source order based on useDataSources config
 * - Calls the low-level InputSource.loadOrThrow
 *
 * @param config - The Polen configuration
 * @returns Effect resolving to the loaded schema with source information or null if schema is disabled.
 */
export const loadOrThrow = (
  config: Config,
): Effect.Effect<InputSourceLoader.LoadedCatalog | null, PlatformError | InputSourceError | Error, FileSystem> =>
  Effect.gen(function*() {
    const result = yield* loadOrNull(config)

    if (result === null && config.schema?.enabled !== false) {
      // Only throw if schema is enabled but none found
      const applicable = yield* findApplicableSource(config)
      if (!applicable) {
        return yield* Effect.fail(new Error(`No applicable schema source found. Please check your configuration.`))
      } else {
        return yield* Effect.fail(new Error(`Schema source was applicable but returned no data`))
      }
    }

    return result
  })

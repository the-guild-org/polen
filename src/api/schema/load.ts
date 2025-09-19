import type { Config } from '#api/config/normalized'
import { Augmentations } from '#api/schema/augmentations/$'
import { type CategoryConfig, processCategoriesWithVersion } from '#api/schema/categories-processor'
import { InputSourceError } from '#api/schema/input-source/errors'
import type { InputSource } from '#api/schema/input-source/input-source'
import * as InputSourceLoader from '#api/schema/input-source/load'
import { InputSources } from '#api/schema/input-sources/$'
import { A, O } from '#dep/effect'
import type { PlatformError } from '@effect/platform/Error'
import type { FileSystem } from '@effect/platform/FileSystem'
import { Effect } from 'effect'
import { Catalog } from 'graphql-kit'

/**
 * Find the first applicable source for the given config.
 * Returns the source and its config, or null if none found.
 */
const findApplicableSource = (
  config: Config,
): Effect.Effect<
  O.Option<{
    source: InputSource
    sourceConfig: object
  }>,
  PlatformError | InputSourceError,
  FileSystem
> =>
  Effect.gen(function*() {
    if (config.schema?.enabled === false) return O.none()

    const allSources: InputSource[] = [
      InputSources.VersionedDirectory.loader,
      InputSources.Directory.loader,
      InputSources.File.loader,
      InputSources.Memory.loader,
      InputSources.Introspection.loader,
      InputSources.IntrospectionFile.loader,
    ]

    const useFirst = config.schema?.useSources
      ? A.isArray(config.schema.useSources)
        ? config.schema.useSources
        : [config.schema.useSources]
      : undefined

    const context: InputSourceLoader.Context = { paths: config.paths }

    const sourcesToTry = useFirst
      ? useFirst.map(name => allSources.find(s => s.name === name))
        .filter((s): s is InputSource => s !== undefined)
      : allSources

    for (const source of sourcesToTry) {
      const sourceConfig = (config.schema?.sources as any)?.[source.name] ?? {}
      const isApplicable = yield* source.isApplicable(sourceConfig, context)

      if (isApplicable) {
        return O.some({
          source,
          sourceConfig,
        })
      }
    }

    return O.none()
  })

/**
 * Check if a schema exists using the configured sources.
 * Returns true if any source has a schema, false otherwise.
 */
export const hasSchema = (config: Config): Effect.Effect<boolean, PlatformError | InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    const source = yield* findApplicableSource(config)
    return O.isSome(source)
  })

/**
 * Load schema without throwing if none found.
 * Returns null if no schema is configured or found.
 */
export const loadOrNull = (
  config: Config,
): Effect.Effect<O.Option<InputSourceLoader.LoadedCatalog>, PlatformError | InputSourceError, FileSystem> =>
  Effect.gen(function*() {
    if (config.schema?.enabled === false) return O.none()

    const applicable = yield* findApplicableSource(config)
    if (O.isNone(applicable)) {
      return O.none()
    }

    const context: InputSourceLoader.Context = { paths: config.paths }
    const applicableValue = applicable.value

    const catalog = yield* applicableValue.source.readIfApplicableOrThrow(
      applicableValue.sourceConfig,
      context,
    )

    if (!catalog) {
      return O.none()
    }

    const loadedSchema: InputSourceLoader.LoadedCatalog = {
      data: O.some(catalog),
      source: applicableValue.source,
      diagnostics: O.none(),
    }

    // Apply augmentations if configured and catalog was loaded
    if (O.isSome(loadedSchema.data) && config.schema?.augmentations) {
      const augmentations = config.schema.augmentations
      const catalog = loadedSchema.data.value as Catalog.Catalog
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
        loadedSchema.diagnostics = O.some(allDiagnostics)
      }
    }

    // Apply categories if configured and catalog was loaded
    if (O.isSome(loadedSchema.data) && config.schema?.categories) {
      const categoriesConfig = config.schema.categories
      const catalog = loadedSchema.data.value as Catalog.Catalog

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
            // @ts-expect-error force write readonly field
            schema.categories = categories
          }
        },
        (unversioned) => {
          // For unversioned catalogs, apply categories directly
          const categories = processCategoriesWithVersion(
            unversioned.schema.definition,
            categoriesConfig as CategoryConfig[] | Record<string, CategoryConfig[]>,
            undefined,
          ) // Update the schema's categories field
          // @ts-expect-error force write readonly field
          unversioned.schema.categories = categories
        },
      )(catalog)
    }

    return O.some(loadedSchema)
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
): Effect.Effect<O.Option<InputSourceLoader.LoadedCatalog>, PlatformError | InputSourceError | Error, FileSystem> =>
  Effect.gen(function*() {
    const result = yield* loadOrNull(config)

    if (O.isNone(result) && config.schema?.enabled !== false) {
      // Only throw if schema is enabled but none found
      const applicable = yield* findApplicableSource(config)
      if (O.isNone(applicable)) {
        return yield* Effect.fail(new Error(`No applicable schema source found. Please check your configuration.`))
      } else {
        return yield* Effect.fail(new Error(`Schema source was applicable but returned no data`))
      }
    }

    return result
  })

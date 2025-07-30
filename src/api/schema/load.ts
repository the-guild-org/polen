import type { Config } from '#api/config/config'
import { Augmentations } from '#api/schema/augmentations/$'
import type { InputSource } from '#api/schema/input-source/input-source'
import * as InputSourceLoader from '#api/schema/input-source/load'
import { InputSources } from '#api/schema/input-sources/$'
import { Catalog } from '#lib/catalog/$'
import { Arr } from '@wollybeard/kit'

/**
 * Find the first applicable source for the given config.
 * Returns the source and its config, or null if none found.
 */
const findApplicableSource = async (
  config: Config,
): Promise<
  {
    source: InputSource
    sourceConfig: object
  } | null
> => {
  if (config.schema?.enabled === false) return null

  const allSources = [
    InputSources.VersionedDirectory.loader,
    InputSources.Directory.loader,
    InputSources.File.loader,
    InputSources.Memory.loader,
    InputSources.Introspection.loader,
    InputSources.IntrospectionFile.loader,
  ]

  const useFirst = config.schema?.useSources
    ? Arr.sure(config.schema.useSources)
    : null

  const context: InputSourceLoader.Context = { paths: config.paths }

  const sourcesToTry = useFirst
    ? useFirst.map(name => allSources.find(s => s.name === name)).filter(Boolean) as InputSource[]
    : allSources

  for (const source of sourcesToTry) {
    const sourceConfig = (config.schema?.sources as any)?.[source.name] ?? {}
    if (await source.isApplicable(sourceConfig, context)) {
      return {
        source: source as any,
        sourceConfig,
      }
    }
  }

  return null
}

/**
 * Check if a schema exists using the configured sources.
 * Returns true if any source has a schema, false otherwise.
 */
export const hasSchema = async (config: Config): Promise<boolean> => {
  const source = await findApplicableSource(config)
  return source !== null
}

/**
 * High-level schema loader that handles all configuration and source assembly.
 *
 * This function:
 * - Creates InputSource instances for all available sources
 * - Determines source order based on useDataSources config
 * - Calls the low-level InputSource.loadOrThrow
 *
 * @param config - The Polen configuration
 * @returns Promise resolving to the loaded schema with source information or null if schema is disabled.
 */
export const loadOrThrow = async (
  config: Config,
): Promise<InputSourceLoader.LoadedCatalog | null> => {
  if (config.schema?.enabled === false) return null

  const applicable = await findApplicableSource(config)
  if (!applicable) {
    throw new Error(`No applicable schema source found. Please check your configuration.`)
  }

  const context: InputSourceLoader.Context = { paths: config.paths }
  const catalog = await applicable.source.readIfApplicableOrThrow(
    applicable.sourceConfig,
    context,
  )

  if (!catalog) {
    throw new Error(`Schema source ${applicable.source.name} was applicable but returned no data`)
  }

  const loadedSchema: InputSourceLoader.LoadedCatalog = {
    data: catalog,
    source: applicable.source,
  }

  // Apply augmentations if configured and catalog was loaded
  if (loadedSchema.data && config.schema?.augmentations) {
    const augmentations = config.schema.augmentations
    const catalog = loadedSchema.data as Catalog.Catalog
    Catalog.fold(
      (versioned) => {
        for (const entry of versioned.entries) {
          if (entry.schema.definition) {
            Augmentations.apply(entry.schema.definition, augmentations)
          }
        }
      },
      (unversioned) => {
        if (unversioned.schema.definition) {
          Augmentations.apply(unversioned.schema.definition, augmentations)
        }
      },
    )(catalog)
  }

  return loadedSchema
}

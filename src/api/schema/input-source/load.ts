import { Config as PolenConfig } from '#api/config/$'
import type { Diagnostic } from '#api/schema/augmentations/diagnostics/diagnostic'
import type { Config } from '#api/schema/config'
import type { InputSource } from '#api/schema/input-source/input-source'
import type { Catalog } from 'graphql-kit'

/**
 * Result of schema reading with provenance tracking for file watching and debugging.
 */
export interface LoadedCatalog {
  data: Catalog.Catalog | null
  source: InputSource
  diagnostics?: Diagnostic[]
  // {
  //   type: DataSourceType
  //   /**
  //    * Recreate the schema data and file after it has been deleted.
  //    *
  //    * This function re-fetches data from the original source and recreates
  //    * the schema file on disk. Only called by file watchers after deletion.
  //    *
  //    * @returns Promise resolving to the recreated schema data, or null if recreation fails
  //    */
  //   reCreate?: () => Promise<Catalog.Catalog | null>
  // }
}

export interface Context {
  paths: PolenConfig.Config['paths']
}

type InputSourceName = string

export const loadOrThrow = async (
  params: {
    context: Context
    config: Config | null
    useFirst: (InputSourceName[]) | null
    sources: InputSource[]
  },
): Promise<LoadedCatalog> => {
  const getSourceConfig = (sourceName: InputSourceName) => {
    const sourceConfigs = (params.config?.sources ?? {}) as Record<InputSourceName, object>
    const sourceConfig = sourceConfigs[sourceName] ?? {}
    return sourceConfig
  }
  // If useFirst is specified, try sources in that specific order
  if (params.useFirst) {
    for (const sourceName of params.useFirst) {
      const source = params.sources.find(s => s.name === sourceName)
      if (!source) continue

      const sourceConfig = getSourceConfig(source.name)
      const result = await source.readIfApplicableOrThrow(sourceConfig as any, params.context)
      if (result) {
        return {
          data: result,
          source,
        }
      }
    }
  } else {
    // Otherwise, try all sources in the order they were provided
    for (const source of params.sources) {
      const sourceConfig = getSourceConfig(source.name)
      const result = await source.readIfApplicableOrThrow(sourceConfig as any, params.context)
      if (result) {
        return {
          data: result,
          source,
        }
      }
    }
  }

  throw new Error(`No applicable schema source found. Please check your configuration.`)
}

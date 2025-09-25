import { Config as PolenConfig } from '#api/config/$'
import type { Diagnostic } from '#api/schema/augmentations/diagnostics/diagnostic'
import type { Config } from '#api/schema/config'
import type { InputSource } from '#api/schema/input-source/input-source'
import { Ef, Op } from '#dep/effect'
import { Data } from 'effect'
import type { Catalog } from 'graphql-kit'

/**
 * Result of schema reading with provenance tracking for file watching and debugging.
 */
export interface LoadedCatalog {
  data: Op.Option<Catalog.Catalog>
  source: InputSource
  diagnostics: Op.Option<Diagnostic[]>
}

export interface Context {
  paths: PolenConfig.Config['paths']
}

// Custom error types
export class NoApplicableSourceError extends Data.TaggedError('NoApplicableSourceError')<{
  readonly sources: string[]
}> {}

export class SourceReadError extends Data.TaggedError('SourceReadError')<{
  readonly source: string
  readonly error: unknown
}> {}

export type LoadError = NoApplicableSourceError | SourceReadError

type InputSourceName = string

export const loadOrThrow = (
  params: {
    context: Context
    config: Op.Option<Config>
    useFirst: Op.Option<InputSourceName[]>
    sources: InputSource[]
  },
): Ef.Effect<LoadedCatalog, LoadError, import('@effect/platform/FileSystem').FileSystem> =>
  Ef.gen(function*() {
    const getSourceConfig = (sourceName: InputSourceName) => {
      const config = Op.getOrUndefined(params.config)
      const sourceConfigs = (config?.sources ?? {}) as Record<InputSourceName, object>
      const sourceConfig = sourceConfigs[sourceName] ?? {}
      return sourceConfig
    }

    // If useFirst is specified, try sources in that specific order
    const sourcesToTry = Op.match(params.useFirst, {
      onNone: () => params.sources,
      onSome: (useFirst) => {
        const ordered: InputSource[] = []
        for (const sourceName of useFirst) {
          const source = params.sources.find(s => s.name === sourceName)
          if (source) ordered.push(source)
        }
        return ordered
      },
    })

    // Try each source
    for (const source of sourcesToTry) {
      const sourceConfig = getSourceConfig(source.name)
      const result = yield* source.readIfApplicableOrThrow(sourceConfig, params.context).pipe(
        Ef.mapError((error) =>
          new SourceReadError({
            source: source.name,
            error,
          })
        ),
      )

      if (result) {
        return {
          data: Op.some(result),
          source,
          diagnostics: Op.none(),
        }
      }
    }

    return yield* Ef.fail(
      new NoApplicableSourceError({
        sources: params.sources.map(s => s.name),
      }),
    )
  })

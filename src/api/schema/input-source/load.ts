import { Config as PolenConfig } from '#api/config/$'
import type { Diagnostic } from '#api/schema/augmentations/diagnostics/diagnostic'
import type { Config } from '#api/schema/config'
import type { InputSource } from '#api/schema/input-source/input-source'
import { O } from '#dep/effect'
import { Data, Effect } from 'effect'
import type { Catalog } from 'graphql-kit'

/**
 * Result of schema reading with provenance tracking for file watching and debugging.
 */
export interface LoadedCatalog {
  data: O.Option<Catalog.Catalog>
  source: InputSource
  diagnostics: O.Option<Diagnostic[]>
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
    config: O.Option<Config>
    useFirst: O.Option<InputSourceName[]>
    sources: InputSource[]
  },
): Effect.Effect<LoadedCatalog, LoadError, import('@effect/platform/FileSystem').FileSystem> =>
  Effect.gen(function*() {
    const getSourceConfig = (sourceName: InputSourceName) => {
      const config = O.getOrUndefined(params.config)
      const sourceConfigs = (config?.sources ?? {}) as Record<InputSourceName, object>
      const sourceConfig = sourceConfigs[sourceName] ?? {}
      return sourceConfig
    }

    // If useFirst is specified, try sources in that specific order
    const sourcesToTry = O.match(params.useFirst, {
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
        Effect.mapError((error) =>
          new SourceReadError({
            source: source.name,
            error,
          })
        ),
      )

      if (result) {
        return {
          data: O.some(result),
          source,
          diagnostics: O.none(),
        }
      }
    }

    return yield* Effect.fail(
      new NoApplicableSourceError({
        sources: params.sources.map(s => s.name),
      }),
    )
  })

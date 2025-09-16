import { InputSource } from '#api/schema/input-source/$'
import type { InputSourceError } from '#api/schema/input-source/errors'
import type { PlatformError } from '@effect/platform/Error'
import type { FileSystem } from '@effect/platform/FileSystem'
import { Err, Fn } from '@wollybeard/kit'
import { Effect } from 'effect'
import type { Catalog } from 'graphql-kit'

type Options = object

// ============================================================================
// Effect-based InputSource
// ============================================================================

export interface EffectInputSource<
  $Name extends string = string,
  $Options extends Options = Options,
  $Catalog extends Catalog.Catalog = Catalog.Catalog,
> {
  name: $Name
  isApplicable: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<boolean, PlatformError | InputSourceError, FileSystem>
  readIfApplicableOrThrow: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
  reCreate?: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
}

export const createEffect = <
  $Name extends string,
  $Options extends Options,
  $Catalog extends Catalog.Catalog,
>(input: {
  name: $Name
  isApplicable?: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<boolean, PlatformError | InputSourceError, FileSystem>
  readIfApplicableOrThrow: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
  reCreate?: (
    options: $Options,
    context: InputSource.Context,
  ) => Effect.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
}): EffectInputSource<$Name, $Options, $Catalog> => {
  const defaultIsApplicable = (
    options: $Options,
    context: InputSource.Context,
  ): Effect.Effect<boolean, PlatformError | InputSourceError, FileSystem> =>
    Effect.gen(function*() {
      const result = yield* Effect.either(input.readIfApplicableOrThrow(options, context))
      return result._tag === 'Right' && result.right !== null
    })

  return {
    name: input.name,
    isApplicable: input.isApplicable ?? defaultIsApplicable,
    readIfApplicableOrThrow: input.readIfApplicableOrThrow,
    reCreate: input.reCreate,
    __effectInputSource: true,
  } as EffectInputSource<$Name, $Options, $Catalog> & { __effectInputSource: true }
}

// ============================================================================
// Promise-based InputSource (for backward compatibility)
// ============================================================================

export interface InputSource<
  $Name extends string = string,
  $Options extends Options = Options,
  $Catalog extends Catalog.Catalog = Catalog.Catalog,
> {
  name: $Name
  isApplicable: (options: $Options, context: InputSource.Context) => Promise<boolean>
  readIfApplicableOrThrow: (options: $Options, context: InputSource.Context) => Promise<null | $Catalog>
  reCreate?: (options: $Options, context: InputSource.Context) => Promise<null | $Catalog>
}

export const create = <
  $Name extends string,
  $Options extends Options,
  $Catalog extends Catalog.Catalog,
>(input: {
  name: $Name
  isApplicable?: (options: $Options, context: InputSource.Context) => Promise<boolean>
  readIfApplicableOrThrow: (options: $Options, context: InputSource.Context) => Promise<null | $Catalog>
  reCreate?: (options: $Options, context: InputSource.Context) => Promise<null | $Catalog>
}): InputSource<
  $Name,
  $Options,
  $Catalog
> => {
  const defaultIsApplicable = async (options: $Options, context: InputSource.Context): Promise<boolean> => {
    return Err.tryOrAsync(() => input.readIfApplicableOrThrow(options, context), false).then(Fn.constant(true))
  }

  const api = {
    name: input.name,
    isApplicable: input.isApplicable ?? defaultIsApplicable,
    readIfApplicableOrThrow: input.readIfApplicableOrThrow,
    reCreate: input.reCreate,
  } as InputSource<$Name, $Options, $Catalog>

  return api
}

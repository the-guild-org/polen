import { InputSource } from '#api/schema/input-source/$'
import type { InputSourceError } from '#api/schema/input-source/errors'
import { Ef } from '#dep/effect'
import type { PlatformError } from '@effect/platform/Error'
import type { FileSystem } from '@effect/platform/FileSystem'
import type { Catalog } from 'graphql-kit'

type Options = object

export interface InputSource<
  $Name extends string = string,
  $Options extends Options = Options,
  $Catalog extends Catalog.Catalog = Catalog.Catalog,
> {
  name: $Name
  isApplicable: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<boolean, PlatformError | InputSourceError, FileSystem>
  readIfApplicableOrThrow: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
  reCreate?: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
}

export const create = <
  $Name extends string,
  $Options extends Options,
  $Catalog extends Catalog.Catalog,
>(input: {
  name: $Name
  isApplicable?: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<boolean, PlatformError | InputSourceError, FileSystem>
  readIfApplicableOrThrow: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
  reCreate?: (
    options: $Options,
    context: InputSource.Context,
  ) => Ef.Effect<null | $Catalog, PlatformError | InputSourceError, FileSystem>
}): InputSource<$Name, $Options, $Catalog> => {
  const defaultIsApplicable = (
    options: $Options,
    context: InputSource.Context,
  ): Ef.Effect<boolean, PlatformError | InputSourceError, FileSystem> =>
    Ef.gen(function*() {
      const result = yield* Ef.either(input.readIfApplicableOrThrow(options, context))
      return result._tag === 'Right' && result.right !== null
    })

  const result: InputSource<$Name, $Options, $Catalog> = {
    name: input.name,
    isApplicable: input.isApplicable ?? defaultIsApplicable,
    readIfApplicableOrThrow: input.readIfApplicableOrThrow,
  }

  if (input.reCreate) {
    result.reCreate = input.reCreate
  }

  return result
}

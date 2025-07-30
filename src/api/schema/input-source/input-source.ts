import { InputSource } from '#api/schema/input-source/$'
import type { Catalog } from '#lib/catalog/$'
import { Err, Fn } from '@wollybeard/kit'

type Options = object

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

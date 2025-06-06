import { Arr } from '@wollybeard/kit'
import { ContextualError } from './ContextualError.ts'

/**
 * Aggregation Error enhanced with a context object and types members.
 *
 * The library also exports a serializer you can use.
 */
export class ContextualAggregateError<
  $Errors extends Error | ContextualError = ContextualError,
  $Name extends string = `ContextualAggregateError`,
  $Context extends object = object,
> extends ContextualError<$Name, $Context> {
  override name: $Name = `ContextualAggregateError` as $Name
  constructor(
    message: string,
    context: $Context,
    public readonly errors: readonly $Errors[],
  ) {
    super(message, context, undefined)
  }
}

export const partitionAndAggregateErrors = <Results>(
  results: Results[],
): [Exclude<Results, Error>[], null | ContextualAggregateError<Extract<Results, Error>>] => {
  const [values, errors] = Arr.partitionErrors(results)
  const error = errors.length > 0
    ? new ContextualAggregateError(`One or more extensions are invalid.`, {}, errors)
    : null
  return [values, error]
}

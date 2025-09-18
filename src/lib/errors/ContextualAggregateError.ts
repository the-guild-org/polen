import { ContextualError } from './ContextualError.js'

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
  const values: Exclude<Results, Error>[] = []
  const errors: Extract<Results, Error>[] = []

  for (const result of results) {
    if (result instanceof Error) {
      errors.push(result as Extract<Results, Error>)
    } else {
      values.push(result as Exclude<Results, Error>)
    }
  }

  const error = errors.length > 0
    ? new ContextualAggregateError(`One or more extensions are invalid.`, {}, errors)
    : null
  return [values, error]
}

import { Mask } from '#lib/mask'
import { Err, Str } from '@wollybeard/kit'
import type { Definition, MaskOptions } from './task.js'

export interface Report<$Input, $Output> {
  task: Definition<$Input, $Output>
  execution: {
    input: $Input
    output: $Output | Error
    timings: {
      start: number
      end: number
      duration: number
    }
  }
}

export interface FormatOptions<$Input, $Output> {
  /**
   * Force masks to reveal all data
   */
  debug?: boolean | undefined
  /**
   * A mask to apply to the input (if any) and successful return (if any).
   *
   * @default Uses the mask bundled with the task, if any.
   */
  mask?: MaskOptions<$Input, $Output> | undefined
}

export const formatReport = <$Input, $Output>(
  report: Report<$Input, $Output>,
  options?: FormatOptions<$Input, $Output>,
): string => {
  const maskOptions = options?.debug
    ? undefined
    : (options?.mask ?? report.task.mask)

  // Apply masks
  const maskedInput = maskOptions?.input
    ? Mask.apply(report.execution.input, Mask.create(maskOptions.input))
    : report.execution.input

  const maskedOutput = report.execution.output instanceof Error || !maskOptions?.output
    ? report.execution.output
    : Mask.apply(report.execution.output, Mask.create(maskOptions.output))

  // Format report
  const s = Str.Builder()

  s`Task: ${report.task.name}`
  s`Duration: ${report.execution.timings.duration.toFixed(2)}ms`
  s`Input: ${JSON.stringify(maskedInput, null, 2)}`

  if (report.execution.output instanceof Error) {
    s(Err.inspect(report.execution.output))
  } else {
    s`Output: ${JSON.stringify(maskedOutput, null, 2)}`
  }

  return s.render()
}

export const exitWithReport = <$Input, $Output>(
  report: Report<$Input, $Output>,
  options?: FormatOptions<$Input, $Output>,
): never => {
  const isError = Err.is(report.execution.output)
  const exitCode = isError ? 1 : 0
  console.log(formatReport(report, options))
  process.exit(exitCode)
}

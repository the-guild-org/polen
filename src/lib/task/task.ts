import type { Mask } from '#lib/mask'
import type { Report } from './report.ts'
import { exitWithReport } from './report.ts'

export interface Definition<$Input = any, $Output = any> {
  name: string
  mask?: MaskOptions<$Input, $Output>
}

export interface Task<$Input, $Output> {
  (input: $Input): Promise<Report<$Input, $Output>>
  definition: Definition<$Input, $Output>
}

export interface MaskOptions<$Input, $Output> {
  /**
   * @default true
   */
  input?: Mask.InferOptions<$Input>
  /**
   * @default true
   */
  output?: Mask.InferOptions<$Output>
}

export const create = <$Input, $Output>(
  fn: (input: $Input) => Promise<$Output>,
  options?: {
    /**
     * @default the fn name
     */
    name?: string
    /**
     * An optional default mask to use for successfully returned values.
     */
    mask?: MaskOptions<$Input, $Output>
  },
): Task<$Input, $Output> => {
  const definition: Definition<$Input, $Output> = {
    name: options?.name ?? (fn.name || `anonymous`),
    mask: options?.mask,
  }

  const task = async (input: $Input): Promise<Report<$Input, $Output>> => {
    const start = performance.now()

    try {
      const output = await fn(input)
      const end = performance.now()

      return {
        task: definition,
        execution: {
          input,
          output,
          timings: {
            start,
            end,
            duration: end - start,
          },
        },
      }
    } catch (error) {
      const end = performance.now()

      return {
        task: definition,
        execution: {
          input,
          output: error as Error,
          timings: {
            start,
            end,
            duration: end - start,
          },
        },
      }
    }
  }

  task.definition = definition

  return task
}

/**
 * Sugar method that creates a task, executes it, and exits with the report.
 * Equivalent to: create(fn, options) -> task(input) -> exitWithReport(report)
 *
 * @param fn - The function to wrap as a task
 * @param input - Input to pass to the task
 * @param options - Combined task creation and format options
 */
export const runAndExit = async <$Input, $Output>(
  fn: (input: $Input) => Promise<$Output>,
  input: $Input,
  options?: {
    name?: string
    mask?: MaskOptions<$Input, $Output>
    debug?: boolean
  },
): Promise<never> => {
  const task = create(fn, {
    name: options?.name,
    mask: options?.mask,
  })
  const report = await task(input)
  return exitWithReport(report, {
    debug: options?.debug,
    mask: options?.mask,
  })
}

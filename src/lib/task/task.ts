import type { Mask } from '#lib/mask'
import { Effect } from 'effect'
import type { Report } from './report.js'
import { exitWithReport } from './report.js'

// ============================================================================
// Types
// ============================================================================

export interface Definition<$Input = any, $Output = any> {
  name: string
  mask?: MaskOptions<$Input, $Output> | undefined
}

export interface Task<$Input, $Output, $Error = never, $Requirements = never> {
  (input: $Input): Effect.Effect<Report<$Input, $Output>, $Error, $Requirements>
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

// ============================================================================
// Core Functions
// ============================================================================

export const create = <$Input, $Output, $Error = never, $Requirements = never>(
  fn: (input: $Input) => Effect.Effect<$Output, $Error, $Requirements>,
  options?: {
    /**
     * @default the fn name
     */
    name?: string | undefined
    /**
     * An optional default mask to use for successfully returned values.
     */
    mask?: MaskOptions<$Input, $Output> | undefined
  },
): Task<$Input, $Output, $Error, $Requirements> => {
  const definition: Definition<$Input, $Output> = {
    name: options?.name ?? 'anonymous',
    mask: options?.mask,
  }

  const task = (input: $Input): Effect.Effect<Report<$Input, $Output>, $Error, $Requirements> =>
    Effect.gen(function*() {
      const start = performance.now()

      const result = yield* fn(input).pipe(
        Effect.either,
      )

      const end = performance.now()

      if (result._tag === 'Right') {
        return {
          task: definition,
          execution: {
            input,
            output: result.right,
            timings: {
              start,
              end,
              duration: end - start,
            },
          },
        }
      } else {
        return {
          task: definition,
          execution: {
            input,
            output: result.left as Error,
            timings: {
              start,
              end,
              duration: end - start,
            },
          },
        }
      }
    })

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
export const runAndExit = <$Input, $Output, $Error = never, $Requirements = never>(
  fn: (input: $Input) => Effect.Effect<$Output, $Error, $Requirements>,
  input: $Input,
  options?: {
    name?: string | undefined
    mask?: MaskOptions<$Input, $Output> | undefined
    debug?: boolean | undefined
  },
): Effect.Effect<never, never, $Requirements> =>
  Effect.gen(function*() {
    const task = create(fn, {
      name: options?.name,
      mask: options?.mask,
    })
    // The task function handles errors internally and wraps them in the report
    // so it should never fail - it always returns a Report
    const report = yield* task(input)
    // exitWithReport calls process.exit, so it never returns
    exitWithReport(report, {
      debug: options?.debug,
      mask: options?.mask,
    })
    // This line will never be reached, but TypeScript needs it for the never type
    return yield* Effect.die('unreachable')
  }) as Effect.Effect<never, never, $Requirements>

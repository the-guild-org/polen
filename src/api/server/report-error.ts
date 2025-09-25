import { Ef } from '#dep/effect'
import { Err } from '@wollybeard/kit'
import cleanStack from 'clean-stack'
import { Data } from 'effect'
import { ErrorParser } from 'youch-core'
import type { ParsedError, StackFrame } from 'youch-core/types'

// Custom error types
export class ErrorParsingError extends Data.TaggedError('ErrorParsingError')<{
  readonly originalError: unknown
  readonly parseError: unknown
}> {}

export type ReportErrorError = ErrorParsingError | Error

/**
 * Report an error with stack trace and code snippets.
 * Returns an Effect that handles error parsing and reporting.
 *
 * @param value - The error value to report
 * @returns Effect that reports the error with snippets
 */
export const reportError = (value: unknown): Ef.Effect<void, ReportErrorError, never> =>
  Ef.gen(function*() {
    const error = Err.ensure(value)

    const excludeStackFramesPattern = /.*(?:rolldown-vite|rolldown|node_modules).*/

    cleanStackRecursive(error, excludeStackFramesPattern)

    Err.log(error)

    const parser = new ErrorParser()

    const parsedError = yield* Ef.tryPromise({
      try: () => parser.parse(error),
      catch: (parseError) =>
        new ErrorParsingError({
          originalError: error,
          parseError,
        }),
    })

    const snippets = createSnippets(parsedError)

    if (snippets) {
      console.log(`\n\n\n\n` + snippets)
    }
  })

const createSnippets = (parsedError: ParsedError) => {
  const snippets = parsedError.frames.map((frame) => {
    let snippet = createSnippet(frame)

    snippet = frame.fileName + `\n` + frame.lineNumber + `\n\n` + snippet
    return snippet
  }).join(`\n\n----------------------------------------------------------------------------------\n\n`)
  return snippets
}

const createSnippet = (stackFrame: StackFrame) => {
  const snippet = stackFrame.source?.map(line => {
    return line.lineNumber.toString().padStart(4, ` `) + `: ` + line.chunk
  }).join(`\n`)

  return snippet
}

// todo:
// pathFilter: Fn.compose(Str.isMatchWith(excludePattern), Bool.negate)
const cleanStackRecursive = (value: unknown, excludePattern: RegExp) => {
  if (value instanceof AggregateError) {
    value.errors.forEach((error) => {
      cleanStackRecursive(error, excludePattern)
    })
  }
  // console.log(`Filtering path: ${path}`, isInclude ? 'Included' : 'Excluded')
  if (value instanceof Error) {
    const cleanedStack = cleanStack(value.stack, {
      pathFilter: (path) => !path.match(excludePattern),
      // todo
      // basePath: config.paths.project.rootDir,
      // pretty: true,
    })
    if (cleanedStack) {
      value.stack = cleanedStack
    }

    cleanStackRecursive(value.cause, excludePattern)
  }
}

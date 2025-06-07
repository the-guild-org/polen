import { Vite } from '#dep/vite/index'
import { Err, Str } from '@wollybeard/kit'
import { stripAnsi } from 'consola/utils'

export const logger = Vite.createLogger(undefined)

const originalWarn = logger.warn

logger.warn = (msg, options) => {
  // Filter out sourcemap warnings that can cause EPIPE errors in tests
  if (typeof msg === `string` && msg.includes(`Sourcemap for`) && msg.includes(`points to missing source files`)) {
    return
  }
  originalWarn(msg, options)
}

logger.error = (msg, options) => {
  const firstLine = stripAnsi(Str.lines(msg)[0] ?? `<no message>`)
  const cause = options?.error
  const error = new Error(firstLine, { cause })
  Err.log(error)
}

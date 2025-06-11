import type { Config } from '#api/api'
import { Vite } from '#dep/vite/index'
import { Err, Str } from '@wollybeard/kit'
import { stripAnsi } from 'consola/utils'

const baseLogger = Vite.createLogger(undefined)

export const createLogger = (config: Config.Config): Vite.Logger => {
  return {
    ...baseLogger,
    info(msg, options) {
      // Filter out optimization-related messages
      const msgString = typeof msg === 'string' ? msg : String(msg)
      if (
        msgString.includes('new dependencies optimized')
        || msgString.includes('optimized dependencies changed')
        || msgString.includes('Re-optimizing dependencies')
        || msgString.includes('Forced re-optimization')
      ) {
        return
      }
      baseLogger.info(msg, options)
    },
    error(msg, options) {
      if (config.advanced.debug) {
        const firstLine = stripAnsi(Str.lines(msg)[0] ?? `<no message>`)
        const cause = options?.error
        const error = new Error(firstLine, { cause })
        Err.log(error)
      }
    },
  }
}

import type { Config } from '#api/api'
import { Vite } from '#dep/vite/index'
import { Err, Str } from '@wollybeard/kit'
import { stripAnsi } from 'consola/utils'
import { onError } from 'effect/Stream'

const baseLogger = Vite.createLogger(undefined)

export const createLogger = (config: Config.Config): Vite.Logger => {
  return {
    ...baseLogger,
    info(msg, options) {
      // Filter out optimization-related messages
      const msgString = typeof msg === `string` ? msg : String(msg)
      if (
        msgString.includes(`new dependencies optimized`)
        || msgString.includes(`optimized dependencies changed`)
        || msgString.includes(`Re-optimizing dependencies`)
        || msgString.includes(`Forced re-optimization`)
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

export namespace ViteMemoryLogger {
  export type MemoryLog<$Level extends Level = Level> = {
    level: $Level
    message: string
    options: Vite.LogOptions | undefined
  }

  export type Store = {
    all: MemoryLog[]
    errors: MemoryLog<'error'>[]
  }

  export const createStore = (): Store => {
    const store: Store = {
      all: [],
      errors: [],
    }
    return store
  }
  export const create = (params: {
    store: Store
    onError?: (error: Error) => void
  }): Vite.Logger => {
    const store = params.store ?? createStore()
    return {
      ...baseLogger,
      info(message, options) {
        store.all.push({ level: 'info', message, options })
        return
      },
      error(message, options) {
        if (options?.error) {
          params.onError?.(options.error as any)
        }
        const log: MemoryLog<'error'> = {
          level: 'error',
          message,
          options,
        }
        store.all.push(log)
        store.errors.push(log)
        return
      },
    }
  }
}

export const LevelEnum = {
  error: 'error',
  info: 'info',
} as const

export type Level = keyof typeof LevelEnum
export type LevelError = typeof LevelEnum.error
export type LevelInfo = typeof LevelEnum.info

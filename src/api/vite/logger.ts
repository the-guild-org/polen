import { Vite } from '#dep/vite/index.ts'
import { Err, Str } from '@wollybeard/kit'
import { stripAnsi } from 'consola/utils'

export const logger = Vite.createLogger(undefined)

logger.error = (msg, options) => {
  const firstLine = stripAnsi(Str.lines(msg)[0] ?? `<no message>`)
  const cause = options?.error
  const error = new Error(firstLine, { cause })
  Err.log(error)
}

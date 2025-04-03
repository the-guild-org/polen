import { inspect } from 'node:util'
import { colorize } from 'consola/utils'
import { snakeCase } from 'es-toolkit'

export const debug = (...args: [event: string, payload?: unknown]) => {
  const isDebug = process.env[`DEBUG`]
  const isPayloadPassed = args.length === 2
  const [event, payload] = args

  if (isDebug) {
    const debugDepth = parseNumberOr(process.env[`DEBUG_DEPTH`], 0)
    const isPayloadDisabled = debugDepth < 0

    const payloadRendered = isPayloadPassed && !isPayloadDisabled
      ? inspect(payload, {
        colors: true,
        depth: debugDepth,
        compact: true,
        // maxStringLength: 10,
      })
      : ``

    const eventRendered = colorize(
      `bold`,
      colorize(
        `bgMagentaBright`,
        ` ` + snakeCase(event).toUpperCase() + ` `,
      ),
    )

    console.debug(eventRendered, payloadRendered)
  }
}

const parseNumberOr = (str: string | undefined, defaultValue: number): number => {
  const parsed = Number(str)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

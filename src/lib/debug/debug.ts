import { inspect } from 'node:util'
import { colorize } from 'consola/utils'
import { snakeCase } from 'es-toolkit'

type DebugParameters = [event: string, payload?: unknown]

export const create = (namespace?: string) => {
  return (...args: DebugParameters) => {
    const isDebug = process.env[`DEBUG`] === `true` || process.env[`DEBUG`] === `*` ||
      process.env[`DEBUG`] === `1`
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
          maxStringLength: 1000,
        })
        : ``

      const namespaceRendered = namespace
        ? colorize(
          `bold`,
          colorize(
            `bgYellowBright`,
            ` ` + snakeCase(namespace).toUpperCase() + ` `,
          ),
        )
        : ``
      const eventRendered = colorize(
        `bold`,
        colorize(
          `bgMagentaBright`,
          ` ` + snakeCase(event).toUpperCase() + ` `,
        ),
      )
      const prefixRendered = `${namespaceRendered} ${eventRendered}`

      console.debug(prefixRendered, payloadRendered)
    }
  }
}

export const debug = create()

const parseNumberOr = (str: string | undefined, defaultValue: number): number => {
  const parsed = Number(str)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

import { inspect } from 'node:util'
import { colorize } from 'consola/utils'
import { snakeCase } from 'es-toolkit'

type DebugParameters = [event: string, payload?: unknown]

interface State {
  isEnabled: boolean
}

export const create = (namespace?: string, initialState?: State) => {
  const isDebugEnabled = process.env[`DEBUG`] === `true` || process.env[`DEBUG`] === `*` ||
    process.env[`DEBUG`] === `1`

  const state: State = initialState ?? {
    isEnabled: isDebugEnabled,
  }

  const debug = (...args: DebugParameters) => {
    const isPayloadPassed = args.length === 2
    const [event, payload] = args

    if (state.isEnabled) {
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

  debug.toggle = (isEnabled: boolean) => {
    state.isEnabled = isEnabled
  }

  debug.sub = (subNamespace: string) => {
    const stateCopy = structuredClone(state)
    const fullNamespace = namespace ? `${namespace}:${subNamespace}` : subNamespace
    return create(fullNamespace, stateCopy)
  }

  return debug
}

export const debug = create()

const parseNumberOr = (str: string | undefined, defaultValue: number): number => {
  const parsed = Number(str)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

import { inspect } from 'node:util'
import { colorize } from 'consola/utils'
import { snakeCase } from 'es-toolkit'
import { calcIsEnabledFromEnv } from './environment-variable.js'

type DebugParameters = [event: string, payload?: unknown]

export interface Debug {
  (...args: DebugParameters): void
  toggle: (isEnabled: boolean) => void
  sub: (subNamespace: string) => Debug
}

interface State {
  isEnabled: boolean
}

export const create = (namespace?: string, initialState?: State): Debug => {
  const isDebugEnabledFromEnv = calcIsEnabledFromEnv(process.env, namespace)

  const state: State = initialState ?? {
    isEnabled: isDebugEnabledFromEnv,
  }

  const debug: Debug = (...args) => {
    const isPayloadPassed = args.length === 2
    const [event, payload] = args

    if (state.isEnabled) {
      // If a payload is an array then default depth to 1 so that we see its _contents_
      const isPayloadArray = Array.isArray(payload)
      const depthBoost = isPayloadArray ? 1 : 0
      const defaultDepth = 3
      const debugDepth = parseNumberOr(process.env[`DEBUG_DEPTH`], defaultDepth) + depthBoost
      const isPayloadDisabled = debugDepth < 0

      const payloadRendered = isPayloadPassed && !isPayloadDisabled
        ? inspect(payload, {
          colors: true,
          depth: debugDepth,
          // compact: true,
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

const parseNumberOr = (str: string | undefined, defaultValue: number): number => {
  if (str === ``) return defaultValue

  const parsed = Number(str)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

// initialize root debug

export const debug = create()

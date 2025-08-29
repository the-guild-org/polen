import type { VitePluginJson } from '#lib/vite-plugin-json'
import { debugPolen } from '#singletons/debug'
import { type ComputedRef, effect, isRef } from '@vue/reactivity'
import type { Plugin, ViteDevServer } from 'vite'

interface ReactiveDataOptions {
  /**
   * Virtual module ID (e.g., 'virtual:polen/navbar') that this data will be exported from.
   * The appropriate extension will be appended automatically based on moduleType.
   */
  moduleId: string
  /**
   * The reactive data to expose.
   * Can be either:
   * - A Vue computed ref (recommended)
   * - A function that returns reactive data
   * - A reactive value directly
   */
  data: ComputedRef<object | unknown[]> | (() => object | unknown[]) | object | unknown[]
  /**
   * JSON codec to use
   * Default: JSON
   * Only used when includeJsonPlugin is true
   */
  codec?: VitePluginJson.Codec
  /**
   * Custom plugin name. Can use to help identify this plugin in logs if using many instances of this plugin.
   @default 'reactive-data'
   */
  name?: string
}

const pluginDebug = debugPolen.sub(`vite-reactive-data`)

export const create = (options: ReactiveDataOptions): Plugin => {
  const codec = options.codec ?? JSON
  const moduleId = options.moduleId
  const name = options.name ?? `reactive-data`

  const debug = pluginDebug.sub(name)
  debug(`constructor`, { moduleId })

  let $server: ViteDevServer
  let $invalidationScheduled = false

  const tryInvalidate = () => {
    $invalidationScheduled = false
    if (!$server) throw new Error(`Server not available yet - this should be impossible`)
    const moduleNode = $server.moduleGraph.getModuleById(moduleId)
    if (moduleNode) {
      debug(`invalidate`, { id: moduleNode.id })
      $server.moduleGraph.invalidateModule(moduleNode)
    } else {
      debug(`cannot invalidate`, {
        reason: `notInModuleGraph`,
        moduleId,
        hint: `maybe it was not loaded yet`,
      })
    }
  }

  const scheduleInvalidate = () => {
    if ($invalidationScheduled) return // already scheduled

    $invalidationScheduled = true

    if (!$server) return // server will flush when ready

    tryInvalidate()
  }

  // Helper to get the current data value
  const getData = () => {
    if (isRef(options.data)) {
      return options.data.value
    } else if (typeof options.data === `function`) {
      return options.data()
    } else {
      return options.data
    }
  }

  // Set up reactive effect immediately
  effect(() => {
    // Access data to track dependencies
    const data = getData()
    debug(`effect triggered`, { data })

    scheduleInvalidate()
  })

  return {
    name,

    configureServer(_server) {
      debug(`hook configureServer`)
      $server = _server
      if ($invalidationScheduled) {
        debug(`try invalidate scheduled before server was ready`)
        tryInvalidate()
      }
    },

    resolveId(id) {
      if (id === moduleId) {
        return moduleId
      }
    },

    // todo make use of Vite's builtin json plugin
    // for example, call it here somehow
    load(id) {
      if (id !== moduleId) return

      const data = getData()
      debug(`hook load`, { data })

      return {
        code: codec.stringify(data),
        map: null,
      }
    },
  }
}

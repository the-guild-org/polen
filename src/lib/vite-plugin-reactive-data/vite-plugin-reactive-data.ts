import { ensureEnd } from '#lib/kit-temp'
import { VitePluginJson } from '#lib/vite-plugin-json/index'
import { superjson } from '#singletons/superjson'
import { type ComputedRef, effect, isRef } from '@vue/reactivity'
import { Debug } from '@wollybeard/kit'
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
  /** Debounce updates (ms). If not set, uses process.nextTick for batching */
  debounce?: number
  /**
   * JSON codec to use (e.g., superjson)
   * Default: superjson
   * Only used when includeJsonPlugin is true
   */
  codec?: VitePluginJson.Codec
  /**
   * Custom plugin name. Can use to help identify this plugin in logs if using many instances of this plugin.
   @default 'reactive-data'
   */
  name?: string
  /**
   * Module type to return. Default: 'json'
   * Use 'superjson' to avoid conflicts with built-in JSON plugin
   */
  moduleType?: string
}

const debug = Debug.create('vite-plugin-reactive-data')

export const create = (options: ReactiveDataOptions): Plugin => {
  const codec = options.codec ?? superjson
  const moduleType = options.moduleType ?? 'json'
  const moduleId = ensureEnd(options.moduleId, `.${moduleType}`)
  const name = options.name ?? `reactive-data`

  let server: ViteDevServer
  let updateTimer: NodeJS.Timeout | undefined
  let updateScheduled = false

  const doUpdate = () => {
    debug('update')
    updateTimer = undefined
    updateScheduled = false
    if (!server) return
    const moduleNode = server.moduleGraph.getModuleById(moduleId)
    if (moduleNode) {
      server.moduleGraph.invalidateModule(moduleNode)
    }
  }

  const scheduleUpdate = () => {
    if (options.debounce) {
      // User wants actual debouncing for rapid updates
      if (updateTimer) clearTimeout(updateTimer)
      updateTimer = setTimeout(doUpdate, options.debounce)
    } else {
      // Just batch synchronous updates using nextTick
      if (updateScheduled) return
      updateScheduled = true
      process.nextTick(doUpdate)
    }
  }

  // Helper to get the current data value
  const getData = () => {
    if (isRef(options.data)) {
      return options.data.value
    } else if (typeof options.data === 'function') {
      return options.data()
    } else {
      return options.data
    }
  }

  // Set up reactive effect immediately
  effect(() => {
    // Access data to track dependencies
    const data = getData()
    debug('data changed:', data)
    // Trigger update only if server is available
    if (server) {
      scheduleUpdate()
    }
  })

  return {
    name,

    configureServer(_server) {
      server = _server
      // Trigger initial update since server is now available
      scheduleUpdate()
    },

    resolveId(id) {
      if (id === moduleId) {
        return moduleId
      }
    },

    load: {
      // todo: doesn't work for some reason, prefer over handler
      // filter: {
      //   id: {
      //     include: moduleId,
      //   },
      // },
      handler: (id) => {
        if (id !== moduleId) return

        const data = getData()
        // Return just the raw JSON string - let the JSON plugin handle the transformation
        return codec.stringify(data)
      },
    },
  }
}

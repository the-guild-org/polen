import type { VitePluginJson } from '#lib/vite-plugin-json/index'
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
   * JSON codec to use (e.g., superjson)
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
  const resolvedModuleId = moduleId
  const name = options.name ?? `reactive-data`

  const debug = pluginDebug.sub(name)
  debug(`constructor`, { moduleId })

  let $server: ViteDevServer
  let $invalidationScheduled = false
  // Store environment names rather than Environment references to ensure we always
  // get the current environment instance via dynamic lookup. This avoids potential
  // issues with stale references if environments are recreated during dev server
  // lifecycle. See: vite-environment-stability-question.md
  const envNamesLoaded = new Set<string>()

  const tryInvalidate = () => {
    $invalidationScheduled = false

    if (!$server || !$server.environments) {
      debug(`no server or environments available for invalidation`)
      return
    }

    // If no environments loaded the module yet, log diagnostic info
    if (envNamesLoaded.size === 0) {
      debug(`nothing to invalidate`, {
        reason: `notLoadedInAnyEnvironment`,
        moduleId: resolvedModuleId,
      })
      return
    }

    for (const envName of envNamesLoaded) {
      const env = $server.environments[envName]
      if (env && env.moduleGraph) {
        const moduleNode = env.moduleGraph.getModuleById(resolvedModuleId)
        if (moduleNode) {
          debug(`invalidate`, {
            moduleNode: { id: moduleNode.id },
            environment: { name: envName },
          })
          env.moduleGraph.invalidateModule(moduleNode)
        } else {
          debug(`invalidate failed`, {
            reason: `moduleNotFound`,
            environment: { name: envName },
          })
        }
      }
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
        return resolvedModuleId
      }
    },

    // todo make use of Vite's builtin json plugin
    // for example, call it here somehow
    load(id) {
      if (id !== resolvedModuleId) return

      envNamesLoaded.add(this.environment.name)

      const data = getData()
      debug(`hook load`, { data, env: this.environment.name })

      return {
        code: codec.stringify(data),
        map: null,
      }
    },
  }
}

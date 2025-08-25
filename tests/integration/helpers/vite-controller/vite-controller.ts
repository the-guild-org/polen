import { Api } from '#api/index'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig, type ViteUserConfigWithPolen } from '#vite/config'
import { ViteMemoryLogger } from '#vite/logger'
import { Obj, Url } from '@wollybeard/kit'

export type ViteDevServerPlus = Vite.ViteDevServer & {
  cannonicalUrl: URL
  url: Url.Factory
  logs: ViteMemoryLogger.Store
  configPolen: Api.Config.Config
}

export interface ViteController {
  startDevelopmentServer: (
    viteUserConfig: Vite.UserConfig,
    testOptionsOverrides?: TestOptions,
  ) => Promise<ViteDevServerPlus>
  stopDevelopmentServer: () => Promise<void>
  devPolen: (config?: Api.Config.ConfigInput, testOptionsOverrides?: TestOptions) => Promise<ViteDevServerPlus>
  devLoggerStores: ViteMemoryLogger.Store[]
}

export type TestOptions = {
  throwOnError?: boolean | undefined
}

export type TestOptionsResolved = Required<TestOptions>

export const defaultTestOptions: TestOptionsResolved = {
  throwOnError: true,
}

export const resolveTestOptions = (...optionsStack: (TestOptions | undefined)[]): TestOptionsResolved => {
  let previous = defaultTestOptions
  for (const options of optionsStack) {
    if (options) {
      previous = Obj.mergeDefaults(options, previous)
    }
  }
  return previous
}

interface State {
  viteDevServer: ViteDevServerPlus | null
  devLoggerStores: ViteMemoryLogger.Store[]
}

export const create = (
  config?: {
    cwd?: string
    defaultConfigInput?: Api.Config.ConfigInput
    options?: TestOptions
  },
): ViteController => {
  const state: State = {
    viteDevServer: null,
    devLoggerStores: [],
  }

  const self: ViteController = {
    devPolen: async (configInput, testOptions) => {
      const configInputMerged = Api.Config.mergeInputs(config?.defaultConfigInput, configInput)
      const appConfig = await Api.ConfigResolver.fromMemory(configInputMerged, config?.cwd)
      // dump(appConfig)
      const viteConfig = toViteUserConfig(appConfig)
      const svr = await self.startDevelopmentServer(viteConfig, testOptions)
      return svr
    },
    devLoggerStores: state.devLoggerStores,
    startDevelopmentServer: async (viteUserConfig, testOptionsOverrides) => {
      // Setup logger
      const memoryLoggerStore = ViteMemoryLogger.createStore()
      viteUserConfig.customLogger = ViteMemoryLogger.create({
        store: memoryLoggerStore,
      })
      // viteUserConfig.logLevel = 'info'
      // Create instance
      const svr = await Vite.createServer(viteUserConfig) as ViteDevServerPlus
      await svr.listen()
      const cannonicalUrl = svr.resolvedUrls?.local[0]
      if (!cannonicalUrl) throw new Error(`No local URL found`)
      // Attach extensions
      svr.logs = memoryLoggerStore
      state.devLoggerStores.push(memoryLoggerStore)
      svr.configPolen = (viteUserConfig as ViteUserConfigWithPolen)._polen
      svr.cannonicalUrl = new URL(cannonicalUrl)
      svr.url = Url.factory(svr.cannonicalUrl)
      state.viteDevServer = svr
      // return
      return svr
    },
    stopDevelopmentServer: async () => {
      if (state.viteDevServer) {
        const viteDevServer = state.viteDevServer
        state.viteDevServer = null
        await viteDevServer.close()
      }
    },
  }

  return self
}

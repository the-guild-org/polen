import { Vite } from '../../../../src/lib/vite/_namespace.js'

export type ViteDevServerPlus = Vite.ViteDevServer & { cannonicalUrl: URL }

export interface ViteController {
  startDevelopmentServer: (viteUserConfig: Vite.UserConfig) => Promise<ViteDevServerPlus>
  stopDevelopmentServer: () => Promise<void>
}

interface State {
  viteDevServer: ViteDevServerPlus | null
}

export const create = (): ViteController => {
  const state: State = {
    viteDevServer: null,
  }

  const controller: ViteController = {
    startDevelopmentServer: async viteUserConfig => {
      state.viteDevServer = await Vite.createServer(viteUserConfig) as ViteDevServerPlus
      await state.viteDevServer.listen()
      const cannonicalUrl = state.viteDevServer.resolvedUrls?.local[0]
      if (!cannonicalUrl) throw new Error(`No local URL found`)
      state.viteDevServer.cannonicalUrl = new URL(cannonicalUrl)
      return state.viteDevServer
    },
    stopDevelopmentServer: async () => {
      if (state.viteDevServer) {
        const viteDevServer = state.viteDevServer
        state.viteDevServer = null
        await viteDevServer.close()
      }
    },
  }

  return controller
}

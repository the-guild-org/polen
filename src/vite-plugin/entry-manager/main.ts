import { H3 } from '../../lib/h3/_namespace.js'
import type { Vite } from '../../lib/vite/_namespace.js'
import type { Configurator } from '../configurator/_namespace.js'

export type handler = H3.EventHandler<H3.EventHandlerRequest, H3.EventHandlerResponse<Response>>

export interface Module {
  handler: handler
}

export const importModule = async (
  config: Configurator.Config,
  viteServer: Vite.ViteDevServer,
): Promise<Module> => {
  const module = await viteServer.ssrLoadModule(config.aliases.entryServer)
  // const module = {
  //   default: H3.defineEventHandler(async event => {
  //     return new Response(`hello world`)
  //   }),
  // }
  return {
    handler: module.default as handler,
  }
}

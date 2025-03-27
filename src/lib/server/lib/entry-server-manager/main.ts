import type { H3 } from '../../../h3/_namespace'
import { Path } from '../../../path/_namespace'
import type { Vite } from '../../../vite/_namespace'

export namespace EntryServer {
  export type handler = H3.EventHandler // (url: string) => Promise<{ html: string, status: 200 | 404 }>
  export interface Module {
    handler: handler
  }
}

export const importModule = async (
  viteServer: Vite.ViteDevServer,
): Promise<EntryServer.Module> => {
  const path = Path.join(viteServer.config.root, `entry-server.tsx`)
  const module = await viteServer.ssrLoadModule(path)
  return module as EntryServer.Module
}

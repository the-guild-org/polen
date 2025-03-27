import { H3 } from '../h3/_namespace'
import type { Vite } from '../vite/_namespace'
import { EntryServerManager } from './lib/entry-server-manager/_namespace'

// const createSSRHandler = async (viteServer: Vite.ViteDevServer): Promise<H3.EventHandler> => {
//   const paths = {
//     indexHtml: Path.join(viteServer.config.root, `index.html`),
//     entryServer: Path.join(viteServer.config.root, `entry-server.tsx`),
//   }

//   // return H3.defineEventHandler(async event => {
//   //   const url = event.path || `/`

//   //   try {
//   //     const templateRaw = await Fs.readFile(paths.indexHtml, `utf-8`)
//   //     const templateViteTransformed = await viteServer.transformIndexHtml(url, templateRaw)

//   //     // Load the server entry point
//   const module = await EntryServerManager.importModule(viteServer)

//   return module.handler

//   //     // Render the app
//   //     const appRenderResult = await appEntryServer.render(url)
//   //     console.log(appRenderResult.html)

//   //     // Inject the app HTML into the template
//   //     const pageHtml = templateViteTransformed.replace(`<!--app-html-->`, appRenderResult.html)

//   //     // console.log(pageHtml)
//   //     return new Response(pageHtml, {
//   //       status: appRenderResult.status,
//   //       headers: {
//   //         'Content-Type': `text/html;charset=UTF-8`,
//   //       },
//   //     })
//   //   } catch (error: unknown) {
//   //     // If an error occurs, let Vite fix the stack trace for better debugging
//   //     viteServer.ssrFixStacktrace(error as Error)
//   //     console.error(`SSR Error:`, error)

//   //     return new Response(`Server Error`, {
//   //       status: 500,
//   //       headers: {
//   //         'Content-Type': `text/plain;charset=UTF-8`,
//   //       },
//   //     })
//   //   }
//   // })
// }

export const createServer = async (viteServer: Vite.ViteDevServer): Promise<H3.App> => {
  const h3App = H3.createApp()

  h3App.use(H3.fromNodeMiddleware(viteServer.middlewares))

  const router = H3.createRouter()

  h3App.use(router)

  const entryServerModule = await EntryServerManager.importModule(viteServer)

  router.get(`/**`, entryServerModule.handler)

  return h3App
}

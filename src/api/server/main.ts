// import { H3 } from '../../lib/h3/_namespace'
// import { Nitro } from '../../lib/nitro/_namespace'
// import type { Vite } from '../../lib/vite/_namespace'
// import type { Configurator } from '../../vite-plugin/configurator/_namespace'
// import { EntryManager } from '../../vite-plugin/entry-manager/_namespace'

// export const createNitroBuild = async (
//   config: Configurator.Config,
// ): Promise<Nitro.NitroDevServer> => {
//   const nitro = await Nitro.createNitro({
//     compatibilityDate: `2025-03-27`,
//   })

//   // const nitroDevServer = Nitro.createDevServer(nitro)
//   // nitroDevServer.app.stack.pop() // Get rid of its catch-all worker thing that Nitro gives us.

//   // nitroDevServer.app.use(H3.defineEventHandler(async event => {
//   //   const url = H3.getRequestURL(event)
//   //   if (url.pathname === `/`) {
//   //     console.log(`indexHtml middleware`)
//   //     const indexHtmltemplate = await Fs.readFile(config.paths.viteIndexHtml, `utf-8`)
//   //     const indexHtml = await viteServer.transformIndexHtml(event.path, indexHtmltemplate)
//   //     event.indexHtml = indexHtml
//   //   }
//   // }))

//   // Add SSR handler
//   // const EntryModule = await EntryManager.importModule(config, viteServer)
//   // nitroDevServer.app.use(EntryModule.handler)
//   // const router = H3.createRouter()
//   // console.log(entryServerHandler)
//   // router.get(`/**`, EntryModule.handler)
//   // nitroDevServer.app.use(router)

//   return nitroDevServer
// }

// export const createNitroDevelopment = async (
//   config: Configurator.Config,
//   viteServer: Vite.ViteDevServer,
// ): Promise<Nitro.NitroDevServer> => {
//   const nitro = await Nitro.createNitro({
//     compatibilityDate: `2025-03-27`,
//   })

//   const nitroDevServer = Nitro.createDevServer(nitro)
//   nitroDevServer.app.stack.pop() // Get rid of its catch-all worker thing that Nitro gives us.

//   // nitroDevServer.app.use(H3.defineEventHandler(async event => {
//   //   const url = H3.getRequestURL(event)
//   //   if (url.pathname === `/`) {
//   //     console.log(`indexHtml middleware`)
//   //     const indexHtmltemplate = await Fs.readFile(config.paths.viteIndexHtml, `utf-8`)
//   //     const indexHtml = await viteServer.transformIndexHtml(event.path, indexHtmltemplate)
//   //     event.indexHtml = indexHtml
//   //   }
//   // }))

//   // Add Vite development server middleware
//   nitroDevServer.app.use(H3.fromNodeMiddleware(viteServer.middlewares))

//   // Add SSR handler
//   const EntryModule = await EntryManager.importModule(config, viteServer)
//   nitroDevServer.app.use(EntryModule.handler)
//   // const router = H3.createRouter()
//   // console.log(entryServerHandler)
//   // router.get(`/**`, EntryModule.handler)
//   // nitroDevServer.app.use(router)

//   return nitroDevServer
// }

// // export const create = async (viteServer: Vite.ViteDevServer): Promise<H3.App> => {
// //   const h3App = H3.createApp()

// //   h3App.use(H3.fromNodeMiddleware(viteServer.middlewares))

// //   const router = H3.createRouter()

// //   h3App.use(router)

// //   const entryServerModule = await EntryManager.importModule(viteServer)

// //   router.get(`/**`, entryServerModule.handler)

// //   return h3App
// // }

// export { EntryManager } from '../../vite-plugin/entry-manager/_namespace'

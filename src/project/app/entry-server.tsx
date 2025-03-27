// import { createMemoryHistory } from '@tanstack/react-router'
import { createRouter } from './router/router'
// import ReactDOMServer from 'react-dom/server'
// import type { Server } from '../../lib/server/_namespace'
// import { createStartHandler, StartServer } from '@tanstack/react-start/server'
import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'
// import { getRouterManifest } from '@tanstack/react-start/router-manifest'

export const handler = createStartHandler({
  createRouter,
  // getRouterManifest,
})(defaultRenderHandler)

// export const render: Server.EntryServer.render = async url => {
//   const router = createRouter()

//   const memoryHistory = createMemoryHistory({
//     initialEntries: [url],
//   })

//   router.update({
//     history: memoryHistory,
//   })

//   await router.load()

//   const html = ReactDOMServer.renderToString(
//     <StartServer router={router} />,
//   )

//   const status = router.hasNotFoundMatch() ? 404 : 200

//   return {
//     html,
//     status,
//   }
// }

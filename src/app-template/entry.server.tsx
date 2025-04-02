// import { createRouter } from './router/router'
// // import type { Server } from '../../lib/server/_namespace'
// import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'
// // import { getRouterManifest } from '@tanstack/react-start/router-manifest'

import { createRouter } from './router/router.jsx'
import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'
// import { defineHandlerCallback } from '@tanstack/start-server-core'
// import { ReactDomServer } from '../../lib/react-dom-server/_namespace'

// const startHandlerResponse = defineHandlerCallback(({ request, responseHeaders, router }) => {
//   console.log(`entry server handler`)
//   console.log({
//     serverSsr: router.serverSsr,
//     // responseHeaders,
//     request,
//   })
//   const appHtmlString = ReactDomServer.renderToString(<StartServer router={router} />)
//   // console.log(request.indexHtml)
//   // console.log(appHtmlString)
//   const htmlDocumentString = appHtmlString
//   return new Response(htmlDocumentString, {
//     headers: new Headers({
//       'Content-Type': `text/html`,
//     }),
//   })
// })

export default createStartHandler({
  createRouter,
  // getRouterManifest,
})(defaultRenderHandler)

// export default H3.defineEventHandler(async event => {
//   console.log(`entry server handler`)
//   const router = createRouter()
//   const history = createMemoryHistory({
//     initialEntries: [event.path],
//   })
//   router.update({
//     history,
//   })
//   await router.load()
//   attachRouterServerSsrUtils(router)
//   const appHtml = ReactDomServer.renderToString(<StartServer router={router} />)
//   console.log(appHtml)
//   return event.indexHtml // todo: apply ssr
// })

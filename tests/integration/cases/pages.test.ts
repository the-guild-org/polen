// todo
// import { expect } from 'playwright/test'
// import { Polen } from '../../../src/entrypoints/_namespace.js'
// import { Vite } from '../../../src/lib/vite/_namespace.js'
// import { test } from '../helpers/test.js'

// interface Case {
//   path: string
//   content: string
// }

// const cases: Case[] = [
//   { path: `index`, content: `Hello World` },
// ]

// cases.forEach(({ path, content }) => {
//   test(`can render page at "${path}"`, async ({ page, viteController }) => {
//     const viteUserConfig = Polen.createConfiguration({
//       pages: [
//         {
//           path,
//           content,
//         },
//       ],
//       vite: {
//         customLogger: Vite.createLogger(`silent`, {}),
//       },
//     })
//     const viteDevServer = await viteController.startDevelopmentServer(viteUserConfig)
//     await page.goto(new URL(`/reference/Query`, viteDevServer.cannonicalUrl).href)

//     await expect(page.getByText(content)).toBeVisible()
//   })
// })

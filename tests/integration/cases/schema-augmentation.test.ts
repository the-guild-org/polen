// import { expect } from 'playwright/test'
// import { Vite } from '../../../src/lib-dependencies/vite/index.js'
// import { Polen } from '../../../src/exports/index.js'
// import type { SchemaAugmentation } from '../../../src/api/schema-augmentation/index.js'
// import { test } from '../helpers/test.js'

// const cases: { placement: SchemaAugmentation.AugmentationDescription.Placement }[] = [
//   { placement: `over` },
//   { placement: `after` },
//   { placement: `before` },
// ]

// cases.forEach(({ placement }) => {
//   test(`can augment description with placement of "${placement}"`, async ({ page, vite }) => {
//     const baseContent = `bar`
//     const augmentedContent = `foo`
//     const viteUserConfig = Polen.createConfiguration({
//       schema: {
//         type: `inline`,
//         value: `
// 				"""
//         ${baseContent}
// 				"""
// 				type Query {
// 					hello: String
// 				}
// 			`,
//       },
//       schemaAugmentations: [
//         {
//           type: `description`,
//           on: { type: `TargetType`, name: `Query` },
//           content: augmentedContent,
//           placement,
//         },
//       ],
//       vite: {
//         customLogger: Vite.createLogger(`silent`, {}),
//       },
//     })
//     const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
//     await page.goto(new URL(`/reference/Query`, viteDevServer.cannonicalUrl).href)

//     await expect(page.getByText(augmentedContent)).toBeVisible()
//     if (placement !== `over`) {
//       await expect(page.getByText(baseContent)).toBeVisible()
//     }
//   })
// })

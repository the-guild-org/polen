import { expect } from 'playwright/test'
import type { SchemaAugmentation } from '../../../src/api/schema-augmentation/index.js'
import { configMemorySchema, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'

const cases: { placement: SchemaAugmentation.AugmentationDescription.Placement }[] = [
  { placement: `over` },
  { placement: `after` },
  { placement: `before` },
]

cases.forEach(({ placement }) => {
  test(`can augment description with placement of "${placement}"`, async ({ page, vite }) => {
    const baseContent = `bar`
    const augmentedContent = `foo`
    const viteUserConfig = await pc({
      schema: configMemorySchema(`
        """
        ${baseContent}
        """
        type Query {
          hello: String
        }
      `),
      schemaAugmentations: [
        {
          type: `description`,
          on: { type: `TargetType`, name: `Query` },
          content: augmentedContent,
          placement,
        },
      ],
    })
    const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url(`/reference/Query`).href)

    await expect(page.getByText(augmentedContent)).toBeVisible()
    if (placement !== `over`) {
      await expect(page.getByText(baseContent)).toBeVisible()
    }
  })
})

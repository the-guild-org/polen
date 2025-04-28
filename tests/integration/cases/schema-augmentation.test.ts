import { expect } from 'playwright/test'
import { Vite } from '../../../src/lib-dep/vite/index.js'
import { Polen } from '../../../src/exports/_namespace.js'
import type { SchemaAugmentation } from '../../../src/schema-augmentation/_namespace.js'
import { test } from '../helpers/test.js'

const cases: { placement: SchemaAugmentation.AugmentationDescription.Placement }[] = [
  { placement: `over` },
  { placement: `after` },
  { placement: `before` },
]

cases.forEach(({ placement }) => {
  test(`can augment description with placement of "${placement}"`, async ({ page, viteController }) => {
    const baseContent = `bar`
    const augmentedContent = `foo`
    const viteUserConfig = Polen.createConfiguration({
      schema: {
        type: `inline`,
        value: `
				"""
        ${baseContent}
				"""
				type Query {
					hello: String
				}
			`,
      },
      schemaAugmentations: [
        {
          type: `description`,
          on: { type: `TargetType`, name: `Query` },
          content: augmentedContent,
          placement,
        },
      ],
      vite: {
        customLogger: Vite.createLogger(`silent`, {}),
      },
    })
    const viteDevServer = await viteController.startDevelopmentServer(viteUserConfig)
    await page.goto(new URL(`/reference/Query`, viteDevServer.cannonicalUrl).href)

    await expect(page.getByText(augmentedContent)).toBeVisible()
    if (placement !== `over`) {
      await expect(page.getByText(baseContent)).toBeVisible()
    }
  })
})

import { expect } from 'playwright/test'
import type { Augmentations } from '../../../src/api/schema/augmentations/$.js'
import { configMemorySchema, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'

const cases: { placement: Augmentations.AugmentationDescription.Placement }[] = [
  { placement: 'over' },
  { placement: 'after' },
  { placement: 'before' },
]

cases.forEach(({ placement }) => {
  test.skip(`can augment description with placement of "${placement}"`, async ({ page, vite }) => {
    const baseContent = 'bar'
    const augmentedContent = 'foo'
    const viteUserConfig = await pc({
      schema: {
        ...configMemorySchema(`
          """
          ${baseContent}
          """
          type Query {
            hello: String
          }
        `),
        augmentations: [
          {
            type: 'description',
            on: { type: 'TargetType', name: 'Query' },
            content: augmentedContent,
            placement,
          },
        ],
      },
    })
    const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url('/reference/Query').href)

    await expect(page.getByText(augmentedContent)).toBeVisible()
    if (placement !== 'over') {
      await expect(page.getByText(baseContent)).toBeVisible()
    }
  })
})

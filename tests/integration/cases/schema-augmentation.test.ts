import { expect, test as base } from 'playwright/test'
import { Vite } from '../../../src/lib/vite/_namespace.js'
import { Polen } from '../../../src/_namespace.js'
import type { SchemaAugmentation } from '../../../src/schema-augmentation/_namespace.js'

type ViteDevServerPlus = Vite.ViteDevServer & { cannonicalUrl: URL }

interface ViteDevServerController {
  run: (viteUserConfig: Vite.UserConfig) => Promise<ViteDevServerPlus>
}

interface Fixtures {
  viteDevServerController: ViteDevServerController
}

const test = base.extend<Fixtures>({
  // eslint-disable-next-line
  viteDevServerController: async ({}, use) => {
    let viteDevServer = null as ViteDevServerPlus | null

    const controller: ViteDevServerController = {
      run: async viteUserConfig => {
        viteDevServer = await Vite.createServer(viteUserConfig) as ViteDevServerPlus
        await viteDevServer.listen()
        const cannonicalUrl = viteDevServer.resolvedUrls?.local[0]
        if (!cannonicalUrl) throw new Error(`No local URL found`)
        viteDevServer.cannonicalUrl = new URL(cannonicalUrl)
        return viteDevServer
      },
    }
    // eslint-disable-next-line
    await use(controller)
    if (viteDevServer) {
      await viteDevServer.close()
    }
  },
})

const cases: { placement: SchemaAugmentation.AugmentationDescription.Placement }[] = [
  { placement: `over` },
  { placement: `after` },
]

cases.forEach(({ placement }) => {
  test(`can augment description with placement of "${placement}"`, async ({ page, viteDevServerController }) => {
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
    })
    const viteDevServer = await viteDevServerController.run(viteUserConfig)
    await page.goto(new URL(`/reference/Query`, viteDevServer.cannonicalUrl).href)
    await expect(page.getByText(augmentedContent)).toBeVisible()
    if (placement !== `over`) {
      await expect(page.getByText(baseContent)).toBeVisible()
    }
  })
})

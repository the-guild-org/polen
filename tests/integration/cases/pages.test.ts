import { expect } from 'playwright/test'
import { Polen } from '../../../src/entrypoints/_namespace.js'
import { test } from '../helpers/test.js'
import type { DirectoryLayout } from '../../../src/lib/project-controller/directory-layout.js'
import { Vite } from '../../../src/lib/vite/_namespace.js'

interface Case {
  fixture: DirectoryLayout.Tree
  result: {
    path: string,
    title: string,
    content: string,
  }
}

const cases: Case[] = [
  {
    fixture: { 'pages/a.md': `abc`, 'schema.graphql': `type Query { a: String }` },
    result: { path: `/a`, title: `a`, content: `abc` },
  },
]

cases.forEach(({ fixture, result }) => {
  test(`can render page at "${JSON.stringify(fixture)}"`, async ({ page, viteController, project }) => {
    await project.fileStorage.set(fixture)
    // todo: all embedded react to be used
    await project.shell`pnpm init && pnpm add react` // adds 1s
    const viteUserConfig = Polen.createConfiguration({
      vite: {
        root: project.fileStorage.cwd,
        customLogger: Vite.createLogger(`silent`, {}),
      },
    })
    const viteDevServer = await viteController.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url(result.path).href)
    await expect(page.getByText(result.content)).toBeVisible()
  })
})

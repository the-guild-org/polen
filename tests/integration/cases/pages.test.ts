import { expect } from 'playwright/test'
import { Polen } from '../../../src/exports/_namespace.js'
import { test } from '../helpers/test.js'
import type { DirectoryLayout } from '../../../src/lib/project-controller/directory-layout.js'
import { Vite } from '../../../src/lib-dep/vite/index.js'

interface TestCase {
  title?: string
  fixture: DirectoryLayout.Tree
  result: {
    path: string,
    navBarTitle: string,
    content: string,
  }
}

const testCases: TestCase[] = [
  {
    title: `exact page`,
    fixture: { 'pages/foo.md': `abc`, 'schema.graphql': `type Query { a: String }` },
    result: { path: `/foo`, navBarTitle: `foo`, content: `abc` },
  },
  {
    title: `index page`,
    fixture: { 'pages/foo/index.md': `abc`, 'schema.graphql': `type Query { a: String }` },
    result: { path: `/foo`, navBarTitle: `foo`, content: `abc` },
  },
]

testCases.forEach(({ fixture, result, title }) => {
  test(title ?? JSON.stringify(fixture), async ({ page, viteController, project }) => {
    await project.fileStorage.set(fixture)
    // todo: all embedded react to be used
    await project.shell`pnpm add react` // adds 1s
    const viteUserConfig = Polen.createConfiguration({
      vite: {
        root: project.fileStorage.cwd,
        customLogger: Vite.createLogger(`silent`, {}),
      },
    })
    const viteDevServer = await viteController.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url(`/`).href)
    await page.getByText(result.navBarTitle).click({ timeout: 1000 })
    await expect(page.getByText(result.content)).toBeVisible()
  })
})

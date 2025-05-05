import { test } from '../helpers/test.js'
import type { DirectoryLayout } from '#lib/project-controller/index.js'
import { Polen } from '../../../src/exports/index.js'
import { Vite } from '#dep/vite/index.js'
import { expect } from 'playwright/test'

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
    fixture: { 'pages/foo.md': `abc` },
    result: { path: `/foo`, navBarTitle: `foo`, content: `abc` },
  },
  {
    title: `index page`,
    fixture: { 'pages/foo/index.md': `abc` },
    result: { path: `/foo`, navBarTitle: `foo`, content: `abc` },
  },
]

testCases.forEach(({ fixture, result, title }) => {
  test(title ?? JSON.stringify(fixture), async ({ page, vite, project }) => {
    await project.fileStorage.set(fixture)
    // todo: all embedded react to be used
    await project.shell`pnpm add react` // adds 1s
    const viteUserConfig = Polen.createConfiguration({
      vite: {
        root: project.fileStorage.cwd,
        customLogger: Vite.createLogger(`silent`, {}),
      },
    })
    const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url(`/`).href)
    await page.getByText(result.navBarTitle).click({ timeout: 1000 })
    await expect(page.getByText(result.content)).toBeVisible()
  })
})

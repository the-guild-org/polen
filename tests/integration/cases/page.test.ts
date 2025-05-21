import type { FsLayout } from '@wollybeard/kit'
import { expect } from 'playwright/test'
import { Polen } from '../../../src/exports/index.js'
import { test } from '../helpers/test.js'

interface TestCase {
  title?: string
  fixture: FsLayout.Tree
  result: {
    path: string
    navBarTitle: string
    content: string
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
    await project.layout.set(fixture)
    const viteUserConfig = await Polen.defineConfig({
      root: project.layout.cwd,
      advanced: {
        // In CI auto-detection does not work. Force it.
        jsxImportSource: `polen/dependencies/react`,
      },
    })
    const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await page.goto(viteDevServer.url(`/`).href)
    await page.getByText(result.navBarTitle).click({ timeout: 1000 })
    await expect(page.getByText(result.content)).toBeVisible()
  })
})

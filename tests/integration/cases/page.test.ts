import { Polen } from '#/exports/index.js'
import type { FsLayout } from '@wollybeard/kit'
import { expect } from 'playwright/test'
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
    title: 'md exact page',
    fixture: { 'pages/foo.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'foo', content: 'abc' },
  },
  {
    title: 'md index page',
    fixture: { 'pages/foo/index.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'foo', content: 'abc' },
  },
  {
    title: 'mdx exact page',
    fixture: {
      'pages/foo/index.mdx': `
      # hello

      export const Mdx = () => "mdx"

      <Mdx />
    `,
    },
    result: { path: '/foo', navBarTitle: 'foo', content: 'hello mdx' },
  },
]

testCases.forEach(({ fixture, result, title }) => {
  test(title ?? JSON.stringify(fixture), async ({ page, vite, project }) => {
    await project.layout.set(fixture)
    const viteConfig = await Polen.defineConfig({
      root: project.layout.cwd,
    })
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)
    await page.goto(viteDevServer.url('/').href)
    await page.getByText(result.navBarTitle).click({ timeout: 1000 })
    await expect(page.getByText(result.content)).toBeVisible()
  })
})

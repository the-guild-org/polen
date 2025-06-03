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
    title: 'exact page',
    fixture: { 'pages/foo.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'foo', content: 'abc' },
  },
  {
    title: 'index page',
    fixture: { 'pages/foo/index.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'foo', content: 'abc' },
  },
  {
    title: 'MDX page with React component',
    fixture: {
      'pages/bar.mdx': `
        # Hello MDX

        export const TestComponent = () => <div>Interactive Component</div>

        This is MDX content with a component:

        <TestComponent />
      `,
    },
    result: { path: '/bar', navBarTitle: 'bar', content: 'Hello MDX' },
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

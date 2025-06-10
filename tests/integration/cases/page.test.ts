import { Api } from '#api/index'
import type { FsLayout } from '@wollybeard/kit'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

interface TestCase {
  title?: string
  fixture: FsLayout.Tree
  result: {
    path: string
    navBarTitle?: string
    content?: string | { selector: string; text?: string }
    sidebar?: string | { selector: string; text?: string }
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
  {
    title: 'mdx with GFM strikethrough',
    fixture: {
      'pages/gfm-mdx.mdx': `
Text with ~~strikethrough~~ here.

export const Demo = () => <span>MDX works</span>

<Demo />
      `,
    },
    result: { path: '/gfm-mdx', navBarTitle: 'gfm mdx', content: { selector: 'del', text: 'strikethrough' } },
  },
  {
    title: 'sidebar',
    fixture: { 'pages/foo': { 'index.md': '', 'bar.md': '' } },
    result: { path: '/foo', navBarTitle: 'foo', sidebar: 'bar' },
  },
]

testCases.forEach(({ fixture, result, title }) => {
  test(title ?? JSON.stringify(fixture), async ({ page, vite, project }) => {
    await project.layout.set(fixture)
    const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    await page.goto(viteDevServer.url('/').href)

    if (result.navBarTitle) {
      await page.getByText(result.navBarTitle).click({ timeout: 1000 })
    }

    if (typeof result.content === 'string') {
      await expect(page.getByText(result.content)).toBeVisible()
    } else if (result.content) {
      const locator = result.content.text
        ? page.locator(result.content.selector).filter({ hasText: result.content.text })
        : page.locator(result.content.selector)
      await expect(locator.first()).toBeVisible()
    }

    if (result.sidebar) {
      const sidebar = typeof result.sidebar === 'string'
        ? page.getByTestId('sidebar').getByText(result.sidebar)
        : page.getByTestId('sidebar').locator(result.sidebar.selector)

      await expect(sidebar).toBeVisible()
    }
  })
})

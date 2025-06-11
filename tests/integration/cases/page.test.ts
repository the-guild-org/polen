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
    navBarItems?: string[]
    content?: string | { selector: string; text?: string }
    sidebar?: string | { selector: string; text?: string } | string[]
  }
  additionalChecks?: (context: { page: any }) => Promise<void>
}

const testCases: TestCase[] = [
  {
    title: 'md exact page',
    fixture: { 'pages/foo.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'Foo', content: 'abc' },
  },
  {
    title: 'md index page',
    fixture: { 'pages/foo/index.md': 'abc' },
    result: { path: '/foo', navBarTitle: 'Foo', content: 'abc' },
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
    result: { path: '/foo', navBarTitle: 'Foo', content: 'hello mdx' },
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
    result: { path: '/gfm-mdx', navBarTitle: 'Gfm Mdx', content: { selector: 'del', text: 'strikethrough' } },
  },
  {
    title: 'sidebar',
    fixture: { 'pages/foo': { 'index.md': '', 'bar.md': '' } },
    result: { path: '/foo', navBarTitle: 'Foo', sidebar: 'bar' },
  },
  {
    title: 'sidebar with numbered prefixes',
    fixture: {
      'pages/a': { 'index.md': '', '30_c.md': '', '10_b.md': '', '20_d.md': '' },
    },
    result: {
      path: '/a',
      navBarTitle: 'A',
      sidebar: ['B', 'D', 'C'],
    },
  },
  {
    title: 'numbered prefix with underscore separator',
    fixture: { 'pages/01_a.md': 'test1' },
    result: { path: '/a', navBarTitle: 'A', content: 'test1' },
  },
  {
    title: 'numbered prefix with dash separator',
    fixture: { 'pages/02-b.md': 'test2' },
    result: { path: '/b', navBarTitle: 'B', content: 'test2' },
  },
  {
    title: 'numbered prefix collision - higher number wins',
    fixture: {
      'pages/10_a.md': 'v1',
      'pages/20_a.md': 'v2',
    },
    result: { path: '/a', navBarTitle: 'A', content: 'v2' },
  },
  {
    title: 'sidebar with mixed numbered and non-numbered items',
    fixture: {
      'pages/a': { 'index.md': '', '10_c.md': '', 'b.md': '', '05_d.md': '', 'e.md': '', '20_f.md': '' },
    },
    result: {
      path: '/a',
      navBarTitle: 'A',
      sidebar: ['D', 'C', 'F', 'B', 'E'],
    },
  },
  {
    title: 'sidebar section ordering with numbered prefixes on directories',
    fixture: {
      'pages/a': {
        'index.md': '',
        '30_d': { 'index.md': '', 'e.md': '', 'f.md': '' },
        '10_b': { 'index.md': '', 'g.md': '', 'h.md': '' },
        '20_c': { 'index.md': '', 'i.md': '', 'j.md': '' },
        'k': { 'index.md': '', 'l.md': '' },
      },
    },
    result: {
      path: '/a',
      navBarTitle: 'A',
      sidebar: ['B', 'G', 'H', 'C', 'I', 'J', 'D', 'E', 'F', 'K', 'L'],
    },
  },
  {
    title: 'navigation shows only top-level items',
    fixture: {
      'pages': {
        'aaa.md': '',
        'bbb': { 'index.md': '', 'ccc.md': '', 'ddd': { 'index.md': '', 'eee.md': '' } },
        'fff.md': '',
      },
    },
    result: {
      path: '/',
      navBarItems: ['Aaa', 'Bbb', 'Fff'],
    },
    additionalChecks: async ({ page }) => {
      // Verify only top-level items appear in navigation bar
      // The nested items should only be visible in sidebar, not in header navigation
      // Count total links with these names - they should only exist in sidebar (if visible at all)
      const allCccLinks = page.getByRole('link', { name: 'Ccc' })
      const allDddLinks = page.getByRole('link', { name: 'Ddd' })
      const allEeeLinks = page.getByRole('link', { name: 'Eee' })

      // These nested items should not exist in the header navigation
      // Since we're on root path, sidebar isn't shown, so they shouldn't be visible at all
      await expect(allCccLinks).toHaveCount(0)
      await expect(allDddLinks).toHaveCount(0)
      await expect(allEeeLinks).toHaveCount(0)
    },
  },
  {
    title: 'sidebar sections have correct paths',
    fixture: {
      'pages': {
        'a': { 'index.md': '', 'b.md': '', 'c': { 'index.md': 'x', 'd.md': '' } },
      },
    },
    result: {
      path: '/a',
      navBarTitle: 'A',
    },
    additionalChecks: async ({ page }) => {
      const sidebar = page.getByTestId('sidebar')
      const cLink = sidebar.getByRole('link', { name: 'C' })
      await expect(cLink).toHaveAttribute('href', '/a/c')

      await cLink.click()
      await expect(page).toHaveURL(/\/a\/c$/)
      await expect(page.getByText('x', { exact: true })).toBeVisible()
    },
  },
]

testCases.forEach(({ fixture, result, title, additionalChecks }) => {
  test(title ?? JSON.stringify(fixture), async ({ page, vite, project }) => {
    await project.layout.set(fixture)
    const viteConfig = await Api.ConfigResolver.fromMemory({ root: project.layout.cwd })
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    await page.goto(viteDevServer.url('/').href)

    if (result.navBarTitle) {
      await page.getByRole('link', { name: result.navBarTitle, exact: true }).click({ timeout: 1000 })
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle')
    }

    if (result.navBarItems) {
      // Check that all expected navigation items are present
      // Navigation links are in the header area
      for (const item of result.navBarItems) {
        await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible()
      }
    }

    if (typeof result.content === 'string') {
      await expect(page.getByText(result.content, { exact: true })).toBeVisible()
    } else if (result.content) {
      const locator = result.content.text
        ? page.locator(result.content.selector).filter({ hasText: result.content.text })
        : page.locator(result.content.selector)
      await expect(locator.first()).toBeVisible()
    }

    if (result.sidebar) {
      if (Array.isArray(result.sidebar)) {
        // Check order of sidebar items
        const sidebar = page.getByTestId('sidebar')
        const sidebarLinks = await sidebar.locator('a').all()
        const sidebarTexts = await Promise.all(sidebarLinks.map(link => link.textContent()))
        const actualOrder = sidebarTexts.filter(text => text !== null).map(text => text!.trim())

        // Verify each expected item appears in order
        let lastIndex = -1
        for (const expectedItem of result.sidebar) {
          const currentIndex = actualOrder.findIndex(item => item === expectedItem)

          // Check item exists
          if (currentIndex === -1) {
            throw new Error(
              `Expected "${expectedItem}" to be in sidebar, but it was not found. Actual items: ${
                actualOrder.join(', ')
              }`,
            )
          }

          // Check item is in correct order
          if (currentIndex <= lastIndex) {
            throw new Error(
              `Expected "${expectedItem}" to appear after previous items in sidebar, but it was found at index ${currentIndex} (previous was ${lastIndex})`,
            )
          }

          lastIndex = currentIndex
        }
      } else {
        const sidebar = typeof result.sidebar === 'string'
          ? page.getByTestId('sidebar').getByText(result.sidebar)
          : page.getByTestId('sidebar').locator(result.sidebar.selector)

        await expect(sidebar).toBeVisible()
      }
    }

    // Run any additional checks
    if (additionalChecks) {
      await additionalChecks({ page })
    }
  })
})

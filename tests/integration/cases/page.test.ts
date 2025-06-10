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
    sidebar?: string | { selector: string; text?: string } | string[]
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
  {
    title: 'sidebar with numbered prefixes',
    fixture: {
      'pages/docs': {
        'index.md': '',
        '30_getting-started.md': '# Getting Started',
        '10_installation.md': '# Installation',
        '20_configuration.md': '# Configuration',
      },
    },
    result: {
      path: '/docs',
      navBarTitle: 'docs',
      sidebar: ['Installation', 'Configuration', 'Getting Started'],
    },
  },
  {
    title: 'numbered prefix with underscore separator',
    fixture: { 'pages/01_intro.md': '# Introduction' },
    result: { path: '/intro', navBarTitle: 'intro', content: 'Introduction' },
  },
  {
    title: 'numbered prefix with dash separator',
    fixture: { 'pages/02-overview.md': '# Overview page content' },
    result: { path: '/overview', navBarTitle: 'overview', content: 'Overview page content' },
  },
  {
    title: 'numbered prefix collision - higher number wins',
    fixture: {
      'pages/10_about.md': '# About v1',
      'pages/20_about.md': '# About v2',
    },
    result: { path: '/about', navBarTitle: 'about', content: 'About v2' },
  },
  {
    title: 'sidebar with mixed numbered and non-numbered items',
    fixture: {
      'pages/guide': {
        'index.md': '',
        '10_getting-started.md': '',
        'api-reference.md': '',
        '05_prerequisites.md': '',
        'troubleshooting.md': '',
        '20_advanced.md': '',
      },
    },
    result: {
      path: '/guide',
      navBarTitle: 'guide',
      sidebar: ['Prerequisites', 'Getting Started', 'Advanced', 'Api Reference', 'Troubleshooting'],
    },
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
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle')
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
  })
})

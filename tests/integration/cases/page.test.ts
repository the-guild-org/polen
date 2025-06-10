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
      'pages/docs': {
        'index.md': '',
        '30_getting-started.md': '# Getting Started',
        '10_installation.md': '# Installation',
        '20_configuration.md': '# Configuration',
      },
    },
    result: {
      path: '/docs',
      navBarTitle: 'Docs',
      sidebar: ['Installation', 'Configuration', 'Getting Started'],
    },
  },
  {
    title: 'numbered prefix with underscore separator',
    fixture: { 'pages/01_intro.md': '# Introduction' },
    result: { path: '/intro', navBarTitle: 'Intro', content: 'Introduction' },
  },
  {
    title: 'numbered prefix with dash separator',
    fixture: { 'pages/02-overview.md': '# Overview page content' },
    result: { path: '/overview', navBarTitle: 'Overview', content: 'Overview page content' },
  },
  {
    title: 'numbered prefix collision - higher number wins',
    fixture: {
      'pages/10_about.md': '# About v1',
      'pages/20_about.md': '# About v2',
    },
    result: { path: '/about', navBarTitle: 'About', content: 'About v2' },
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
      navBarTitle: 'Guide',
      sidebar: ['Prerequisites', 'Getting Started', 'Advanced', 'Api Reference', 'Troubleshooting'],
    },
  },
  {
    title: 'sidebar section ordering with numbered prefixes on directories',
    fixture: {
      'pages/docs': {
        'index.md': '# Documentation',
        '30_tutorials': {
          'index.md': '# Tutorials',
          'basic.md': '# Basic Tutorial',
          'advanced.md': '# Advanced Tutorial',
        },
        '10_getting-started': {
          'index.md': '# Getting Started',
          'installation.md': '# Installation',
          'quickstart.md': '# Quick Start',
        },
        '20_guides': {
          'index.md': '# Guides',
          'configuration.md': '# Configuration',
          'deployment.md': '# Deployment',
        },
        'api-reference': {
          'index.md': '# API Reference',
          'core.md': '# Core API',
        },
      },
    },
    result: {
      path: '/docs',
      navBarTitle: 'Docs',
      // Sections should be ordered by their numeric prefixes
      // We'll verify this by checking the complete order
      sidebar: [
        'Getting Started',
        'Installation',
        'Quickstart',
        'Guides',
        'Configuration',
        'Deployment',
        'Tutorials',
        'Advanced', // Alphabetically before Basic
        'Basic',
        'Api Reference',
        'Core',
      ],
    },
  },
  {
    title: 'navigation shows only top-level items',
    fixture: {
      'pages': {
        'about.md': '# About',
        'guides': {
          'index.md': '# Guides',
          'getting-started.md': '# Getting Started',
          'advanced': {
            'index.md': '# Advanced',
            'performance.md': '# Performance',
          },
        },
        'pricing.md': '# Pricing',
      },
    },
    result: {
      path: '/',
      navBarItems: ['About', 'Guides', 'Pricing'],
    },
    additionalChecks: async ({ page }) => {
      // Verify only top-level items appear in navigation
      // Should NOT see nested items like "Getting Started" or "Advanced"
      await expect(page.getByRole('link', { name: 'Getting Started' })).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'Advanced' })).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'Performance' })).not.toBeVisible()
    },
  },
  {
    title: 'sidebar sections have correct paths',
    fixture: {
      'pages': {
        'guides': {
          'index.md': '# Guides',
          'getting-started.md': '# Getting Started',
          'advanced': {
            'index.md': '# Advanced Guide',
            'performance.md': '# Performance',
          },
        },
      },
    },
    result: {
      path: '/guides',
      navBarTitle: 'Guides',
    },
    additionalChecks: async ({ page }) => {
      // Check that sidebar section link has correct full path
      const sidebar = page.getByTestId('sidebar')
      const advancedLink = sidebar.getByRole('link', { name: 'Advanced' })
      await expect(advancedLink).toHaveAttribute('href', '/guides/advanced')

      // Navigate to the advanced section
      await advancedLink.click()
      await expect(page).toHaveURL(/\/guides\/advanced$/)
      await expect(page.getByText('Advanced Guide')).toBeVisible()
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
      await page.getByText(result.navBarTitle).click({ timeout: 1000 })
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

    // Run any additional checks
    if (additionalChecks) {
      await additionalChecks({ page })
    }
  })
})

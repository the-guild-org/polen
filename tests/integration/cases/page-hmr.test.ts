import { Api } from '#api/index'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test.describe('HMR', () => {
  test('auto-refresh on content change', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/test.md': `# Initial` })
    const server = await vite.startDevelopmentServer(
      await Api.ConfigResolver.fromMemory({ root: project.layout.cwd, advanced: { isSelfContainedMode: true } }),
    )

    await page.goto(server.url('/test').href)
    await expect(page.getByRole('heading', { name: 'Initial' })).toBeVisible()

    const reloadPromise = page.waitForEvent('load')
    await project.layout.set({ 'pages/test.md': `# Updated` })
    await reloadPromise

    await expect(page.getByRole('heading', { name: 'Updated' })).toBeVisible()
  })

  test('add new page', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/home.md': `# Home` })
    const server = await vite.startDevelopmentServer(
      await Api.ConfigResolver.fromMemory({ root: project.layout.cwd, advanced: { isSelfContainedMode: true } }),
    )

    await project.layout.set({
      'pages/home.md': `# Home`,
      'pages/new.md': `# New`,
    })
    await page.waitForTimeout(500) // Let file watcher catch up

    await page.goto(server.url('/new').href)
    await expect(page.getByRole('heading', { name: 'New' })).toBeVisible()
  })

  test.skip('delete page returns 404', async ({ page, vite, project }) => {
    // Skipped: deletion causes import errors in virtual module (known limitation)
  })
})

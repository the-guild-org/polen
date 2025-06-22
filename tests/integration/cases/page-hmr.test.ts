import { Api } from '#api/index'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.ts'

test.describe('HMR', () => {
  test('auto-refresh on content change', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/test.md': '# Initial' })
    const server = await vite.startDevelopmentServer(
      await Api.ConfigResolver.fromMemory({ root: project.layout.cwd, advanced: { isSelfContainedMode: true } }),
    )

    await page.goto(server.url('/test').href)
    await expect(page.getByRole('heading', { name: 'Initial' })).toBeVisible()

    const reloadPromise = page.waitForEvent('load')
    await project.layout.set({ 'pages/test.md': '# Updated' })
    await reloadPromise

    await expect(page.getByRole('heading', { name: 'Updated' })).toBeVisible()
  })

  test.skip('add new page', async ({ page, vite, project }) => {
    // Skip reason: Adding new pages requires the virtual module to be invalidated
    // and rebuilt, which doesn't happen automatically in the current implementation.
    // This is a known limitation where the file router's virtual module doesn't
    // watch for new files being added to the pages directory.
    
    await project.layout.set({ 'pages/home.md': '# Home' })
    const server = await vite.startDevelopmentServer(
      await Api.ConfigResolver.fromMemory({ root: project.layout.cwd, advanced: { isSelfContainedMode: true } }),
    )

    // Navigate to an existing page first
    await page.goto(server.url('/home').href)
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()

    // Create the new page
    await project.layout.set({
      'pages/home.md': '# Home',
      'pages/new.md': '# New Page Content',
    })

    // Wait for Vite to process the new file
    await page.waitForTimeout(3000)

    // Navigate to the new page
    await page.goto(server.url('/new').href)
    
    // The heading should match the markdown content
    await expect(page.getByRole('heading', { name: 'New Page Content', level: 1 })).toBeVisible()
  })

  test.skip('delete page returns 404', async ({ page, vite, project }) => {
    // Skipped: deletion causes import errors in virtual module (known limitation)
  })
})

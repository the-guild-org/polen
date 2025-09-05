import { Api } from '#api/$'
import { toViteUserConfig } from '#vite/config'
import { Effect } from 'effect'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test.describe('HMR', () => {
  test('auto-refresh on content change', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/test.md': '# Initial' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory(
        { advanced: { isSelfContainedMode: true } },
        project.layout.cwd,
      ),
    )
    const server = await vite.startDevelopmentServer(toViteUserConfig(polenConfig))

    await page.goto(server.url('/test').href)
    await expect(page.getByRole('heading', { name: 'Initial' })).toBeVisible()

    // Update the file
    await project.layout.set({ 'pages/test.md': '# Updated' })

    // Wait for the content to update (HMR might not trigger a full page reload)
    await expect(page.getByRole('heading', { name: 'Updated' })).toBeVisible({ timeout: 10000 })
  })

  test.skip('add new page', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/home.md': '# Home' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory(
        { advanced: { isSelfContainedMode: true } },
        project.layout.cwd,
      ),
    )
    const server = await vite.startDevelopmentServer(toViteUserConfig(polenConfig))

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
    // Skipped: When a page is deleted, the virtual module still tries to import it,
    // causing module resolution errors. This needs a more sophisticated solution
    // where the route handler catches import errors and returns 404.
  })
})

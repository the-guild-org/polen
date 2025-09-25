import { Api } from '#api/$'
import { Ef } from '#dep/effect'
import { toViteUserConfig } from '#vite/config'
import { NodeFileSystem } from '@effect/platform-node'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test.describe('HMR', () => {
  // Skipped: Flaky in CI - HMR timing is inconsistent across environments
  // TODO: Find a more reliable way to test HMR functionality
  test.skip('auto-refresh on content change', async ({ page, vite, project }) => {
    await Ef.runPromise(
      project.dir.file('pages/test.md', '# Initial').commit().pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )
    const polenConfig = await Ef.runPromise(
      Api.ConfigResolver.fromMemory(
        { advanced: { isSelfContainedMode: true } },
        project.dir.base,
      ).pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )
    const server = await vite.startDevelopmentServer(toViteUserConfig(polenConfig))

    await page.goto(server.url('/test').href)
    await expect(page.getByRole('heading', { name: 'Initial' })).toBeVisible()

    // Update the file
    await Ef.runPromise(
      project.dir.file('pages/test.md', '# Updated').commit().pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )

    // Wait for the content to update (HMR might not trigger a full page reload)
    await expect(page.getByRole('heading', { name: 'Updated' })).toBeVisible({ timeout: 10000 })
  })

  test.skip('add new page', async ({ page, vite, project }) => {
    await Ef.runPromise(
      project.dir.file('pages/home.md', '# Home').commit().pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )
    const polenConfig = await Ef.runPromise(
      Api.ConfigResolver.fromMemory(
        { advanced: { isSelfContainedMode: true } },
        project.dir.base,
      ).pipe(
        Ef.provide(NodeFileSystem.layer),
      ),
    )
    const server = await vite.startDevelopmentServer(toViteUserConfig(polenConfig))

    // Navigate to an existing page first
    await page.goto(server.url('/home').href)
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()

    // Create the new page
    await Ef.runPromise(
      project.dir
        .file('pages/home.md', '# Home')
        .file('pages/new.md', '# New Page Content')
        .commit()
        .pipe(Ef.provide(NodeFileSystem.layer)),
    )

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

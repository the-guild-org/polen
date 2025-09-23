import { renderDate } from '#template/routes/changelog/utils'
import { DateOnly } from 'graphql-kit'
import { expect } from 'playwright/test'
import { configMemorySchemaRevisions, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'

test('shows changelog in navigation bar when multiple schema revisions are provided', async ({ page, vite, project }) => {
  // Set up schema revisions with different content
  const olderSchema = {
    date: new Date('2023-01-01'),
    sdl: `
      type Query {
        hello: String
      }
    `,
  }

  const newerSchema = {
    date: new Date('2023-02-01'),
    sdl: `
      type Query {
        hello: String
        newField: Int
      }
    `,
  }

  // Create Polen configuration with multiple schema revisions
  const viteUserConfig = await pc({
    schema: configMemorySchemaRevisions([olderSchema, newerSchema]),
  }, project.dir.base)

  // Start the development server
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)

  // Navigate to the home page
  await page.goto(viteDevServer.url('/').href)

  // Navigate to the changelog page
  await page.getByRole('link', { name: 'Changelog' }).click()

  // Check for changelog content
  // 1. Verify the date is visible as a heading (not just in nav)
  await expect(page.getByRole('heading', { name: renderDate(DateOnly.make('2023-02-01')) })).toBeVisible()

  // 2. Verify the change is described
  await expect(page.getByText(/added field/i)).toBeVisible()
  await expect(page.locator('code', { hasText: 'newField' })).toBeVisible()
})

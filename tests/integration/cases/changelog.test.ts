import { expect } from 'playwright/test'
import { renderDate } from '../../../src/template/components/Changelog.jsx'
import { configMemorySchemaVersions, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'

test('shows changelog in navigation bar when multiple schema versions are provided', async ({ page, vite }) => {
  // Set up schema versions with different content
  const olderSchema = {
    date: new Date('2023-01-01T00:00:00.000Z'),
    sdl: `
      type Query {
        hello: String
      }
    `,
  }

  const newerSchema = {
    date: new Date('2023-02-01T00:00:00.000Z'),
    sdl: `
      type Query {
        hello: String
        newField: Int
      }
    `,
  }

  // Create Polen configuration with multiple schema versions
  const viteUserConfig = await pc({
    schema: configMemorySchemaVersions([olderSchema, newerSchema]),
  })

  // Start the development server
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)

  // Navigate to the home page
  await page.goto(viteDevServer.url('/').href)

  // Navigate to the changelog page
  await page.getByRole('link', { name: 'Changelog' }).click()

  // Check for changelog content
  // 1. Verify the date is visible
  await expect(page.getByText(renderDate(newerSchema.date))).toBeVisible()

  // 2. Verify the change is described
  await expect(page.getByText(/added query newField/i)).toBeVisible()
})

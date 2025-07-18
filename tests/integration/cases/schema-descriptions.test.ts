import { expect } from 'playwright/test'
import { configMemorySchema, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'

test.skip('renders markdown as HTML in schema type descriptions', async ({ page, vite }) => {
  const viteUserConfig = await pc({
    schema: configMemorySchema(`
      """
      The **Query** type with a [link](https://example.com) and \`code\`.

      It also has:
      - A list item
      - Another item
      """
      type Query {
        """
        Returns a greeting with **bold** text
        """
        hello: String
      }
    `),
  })

  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/reference/Query').href)

  // Verify markdown is rendered as HTML elements
  await expect(page.locator('strong').filter({ hasText: 'Query' })).toBeVisible()
  await expect(page.locator('a[href="https://example.com"]').filter({ hasText: 'link' })).toBeVisible()
  await expect(page.locator('code').filter({ hasText: 'code' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'A list item' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'Another item' })).toBeVisible()

  // Check field description has bold text
  await expect(page.locator('strong').filter({ hasText: 'bold' })).toBeVisible()
})

test.skip('renders GFM features as HTML in descriptions', async ({ page, vite }) => {
  const viteUserConfig = await pc({
    schema: configMemorySchema(`
      """
      A type with ~~strikethrough~~ text.

      | Column 1 | Column 2 |
      | -------- | -------- |
      | Cell A   | Cell B   |
      """
      type User {
        id: ID!
        name: String
      }

      type Query {
        user: User
      }
    `),
  })

  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/reference/User').href)

  // Verify GFM features are rendered as HTML
  await expect(page.locator('del').filter({ hasText: 'strikethrough' })).toBeVisible()
  await expect(page.locator('table')).toBeVisible()
  await expect(page.locator('th').filter({ hasText: 'Column 1' })).toBeVisible()
  await expect(page.locator('th').filter({ hasText: 'Column 2' })).toBeVisible()
  await expect(page.locator('td').filter({ hasText: 'Cell A' })).toBeVisible()
  await expect(page.locator('td').filter({ hasText: 'Cell B' })).toBeVisible()
})

test.skip('renders markdown in field and type descriptions', async ({ page, vite }) => {
  const viteUserConfig = await pc({
    schema: configMemorySchema(`
      type Query {
        """
        Get the current **status**
        """
        status: Status
      }

      """
      Status enum with **markdown** descriptions
      """
      enum Status {
        ACTIVE
        DELETED
      }
    `),
  })

  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)

  // Check Query field description
  await page.goto(viteDevServer.url('/reference/Query').href)
  await expect(page.locator('strong').filter({ hasText: 'status' })).toBeVisible()

  // Check enum type description
  await page.goto(viteDevServer.url('/reference/Status').href)
  await expect(page.locator('strong').filter({ hasText: 'markdown' })).toBeVisible()

  // Note: Enum value descriptions are not currently rendered in the UI
})

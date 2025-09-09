import { expect } from 'playwright/test'
import { configMemorySchema, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'
import type { ViteController } from '../helpers/vite-controller/index.js'

const sdl = 'type Query { hello: String }\ntype Mutation { hello: String }'

test('no reference or changelog when schema is omitted or disabled', async ({ page, vite, project }) => {
  let viteDevServer: ViteController.ViteDevServerPlus
  const tests = async () => {
    {
      // When navigating to a route that doesn't exist, we expect a 404 status
      // Use waitUntil: 'domcontentloaded' to avoid waiting for all resources
      const response = await page.goto(viteDevServer!.url('/reference').href, {
        waitUntil: 'domcontentloaded',
      })
      expect(response?.status()).toBe(404)
    }

    {
      const response = await page.goto(viteDevServer!.url('/changelog').href, {
        waitUntil: 'domcontentloaded',
      })
      expect(response?.status()).toBe(404)
    }

    await page.goto(viteDevServer!.url('/').href)
    await expect(page.getByText('reference')).not.toBeVisible()
    await expect(page.getByText('changelog')).not.toBeVisible()
  }
  {
    // Use isolated project directory - no schema at all
    const viteUserConfig = await pc({}, project.layout.cwd)
    viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await tests()
    await vite.stopDevelopmentServer()
  }
  {
    // Use isolated project directory - schema disabled
    const viteUserConfig = await pc({
      schema: {
        ...configMemorySchema(sdl),
        enabled: false,
      },
    }, project.layout.cwd)
    viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await tests()
    await vite.stopDevelopmentServer()
  }
})

test('can loads schema from memory data source', async ({ page, vite, project }) => {
  const viteUserConfig = await pc({
    schema: configMemorySchema(sdl),
  }, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByRole('link', { name: 'Reference', exact: true }).click()
  // Wait for the page to load
  await page.waitForLoadState('networkidle')
  // Check for Query and Mutation links in the sidebar
  await expect(page.getByTestId('sidebar-link-Query')).toBeVisible()
  await expect(page.getByTestId('sidebar-link-Mutation')).toBeVisible()
})

test('can loads schema from schema data source', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByRole('link', { name: 'Reference', exact: true }).click()
  // Check for Mutation link in the sidebar
  await expect(page.getByTestId('sidebar-link-Mutation')).toBeVisible()
})

test('can loads schema from directory data source', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema/2020-01-01.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByRole('link', { name: 'Reference', exact: true }).click()
  await expect(page.getByTestId('sidebar-link-Mutation')).toBeVisible()
})

test('can loads schema from directory data source with single schema.graphql', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema/schema.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByRole('link', { name: 'Reference', exact: true }).click()
  await expect(page.getByTestId('sidebar-link-Mutation')).toBeVisible()
})

test.skip('can loads schema from introspection data source', async ({ page, vite, project }) => {
  const viteUserConfig = await pc({
    schema: {
      useSources: 'introspection',
      sources: { introspection: { url: 'https://api.graphql-hive.com/graphql' } },
    },
  }, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/reference').href)
  await expect(page.getByText('Query', { exact: true })).toBeVisible()
})

test.skip('introspection loads when no other sources exist', async ({ page, vite, project }) => {
  const viteUserConfig = await pc({
    schema: {
      sources: { introspection: { url: 'https://api.graphql-hive.com/graphql' } },
    },
  }, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/reference').href)
  await expect(page.getByText('Query', { exact: true })).toBeVisible()
})

test('file source takes precedence over introspection by default', async ({ page, vite, project }) => {
  await project.layout.set({ 'schema.graphql': sdl })
  const viteUserConfig = await pc({
    schema: {
      sources: { introspection: { url: 'https://api.graphql-hive.com/graphql' } },
    },
  }, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/reference').href)
  await expect(page.getByRole('link', { name: /Mutation/ })).toBeVisible()
})

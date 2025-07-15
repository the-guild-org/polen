import { expect } from 'playwright/test'
import { configMemorySchema, pc } from '../helpers/polen.js'
import { test } from '../helpers/test.js'
import type { ViteController } from '../helpers/vite-controller/index.js'

const sdl = 'type Query { hello: String }\ntype Mutation { hello: String }'

test('no reference or changelog when schema is omitted or disabled', async ({ page, vite }) => {
  let viteDevServer: ViteController.ViteDevServerPlus
  const tests = async () => {
    {
      const response = await page.goto(viteDevServer!.url('/reference').href)
      expect(response?.status()).toBe(404)
    }

    {
      const response = await page.goto(viteDevServer!.url('/changelog').href)
      expect(response?.status()).toBe(404)
    }

    await page.goto(viteDevServer!.url('/').href)
    await expect(page.getByText('reference')).not.toBeVisible()
    await expect(page.getByText('changelog')).not.toBeVisible()
  }
  {
    const viteUserConfig = await pc()
    viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await tests()
    await vite.stopDevelopmentServer()
  }
  {
    const viteUserConfig = await pc({
      schema: {
        ...configMemorySchema(sdl),
        enabled: false,
      },
    })
    viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
    await tests()
    await vite.stopDevelopmentServer()
  }
})

test('can loads schema from memory data source', async ({ page, vite }) => {
  const viteUserConfig = await pc({
    schema: configMemorySchema(sdl),
  })
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByText('reference').click()
  await expect(page.getByText('Mutation', { exact: true })).toBeVisible()
})

test('can loads schema from schema data source', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByText('reference').click()
  await expect(page.getByText('Mutation', { exact: true })).toBeVisible()
})

test('can loads schema from directory data source', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema/2020-01-01.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByText('reference').click()
  await expect(page.getByText('Mutation', { exact: true })).toBeVisible()
})

test('can loads schema from directory data source with single schema.graphql', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema/schema.graphql': sdl,
  })
  const viteUserConfig = await pc({}, project.layout.cwd)
  const viteDevServer = await vite.startDevelopmentServer(viteUserConfig)
  await page.goto(viteDevServer.url('/').href)
  await page.getByText('reference').click()
  await expect(page.getByText('Mutation', { exact: true })).toBeVisible()
})

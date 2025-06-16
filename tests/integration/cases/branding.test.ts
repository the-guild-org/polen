import { expect } from '@playwright/test'
import { test } from '../test.js'

test(`app with minimal logo file shows inline in website`, async ({ page, vite, project }) => {
  await project.layout.set({
    'logo.svg': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red"/></svg>`,
    'schema.graphql': `type Query { hello: String }`,
  })

  const viteConfig = await pc({
    schema: {
      path: `schema.graphql`,
    },
  })

  const viteDevServer = await vite.startDevelopmentServer(viteConfig)
  await page.goto(viteDevServer.url(`/`).href)

  // Check that logo is displayed in navigation
  const logo = page.locator(`nav img[alt="Logo"]`)
  await expect(logo).toBeVisible()
  
  // Verify it's using the custom logo file
  const logoSrc = await logo.getAttribute(`src`)
  expect(logoSrc).toContain(`logo.svg`)
})

test(`app without logo file gets generated inline one in website`, async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': `type Query { hello: String }`,
  })

  const viteConfig = await pc({
    schema: {
      path: `schema.graphql`,
    },
  })

  const viteDevServer = await vite.startDevelopmentServer(viteConfig)
  await page.goto(viteDevServer.url(`/`).href)

  // Check that logo is displayed in navigation
  const logo = page.locator(`nav img[alt="Logo"]`)
  await expect(logo).toBeVisible()
  
  // Verify it's using the generated logo (data URI)
  const logoSrc = await logo.getAttribute(`src`)
  expect(logoSrc).toMatch(/^data:image\/svg\+xml/)
})

test(`app with minimal logo file is inlined in build`, async ({ page, vite, project }) => {
  await project.layout.set({
    'logo.svg': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="blue"/></svg>`,
    'schema.graphql': `type Query { hello: String }`,
  })

  const viteConfig = await pc({
    schema: {
      path: `schema.graphql`,
    },
  })

  // Build the site
  await vite.build(viteConfig)
  
  // Serve the built site
  const server = await vite.startStaticServer({ directory: project.layout.path(`dist`) })
  await page.goto(server.url(`/`).href)

  // Check that logo is displayed
  const logo = page.locator(`nav img[alt="Logo"]`)
  await expect(logo).toBeVisible()
  
  // In build, logos should be inlined as data URIs
  const logoSrc = await logo.getAttribute(`src`)
  expect(logoSrc).toMatch(/^data:image\/svg\+xml/)
})

test(`app without logo file gets generated one inlined in build`, async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': `type Query { hello: String }`,
  })

  const viteConfig = await pc({
    schema: {
      path: `schema.graphql`,
    },
  })

  // Build the site
  await vite.build(viteConfig)
  
  // Serve the built site
  const server = await vite.startStaticServer({ directory: project.layout.path(`dist`) })
  await page.goto(server.url(`/`).href)

  // Check that logo is displayed
  const logo = page.locator(`nav img[alt="Logo"]`)
  await expect(logo).toBeVisible()
  
  // Generated logos should be inlined as data URIs
  const logoSrc = await logo.getAttribute(`src`)
  expect(logoSrc).toMatch(/^data:image\/svg\+xml/)
})

// Import pc helper
import { pc } from '../helpers.js'
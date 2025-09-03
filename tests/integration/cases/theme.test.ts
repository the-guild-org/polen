import { Api } from '#api/$'
import { toViteUserConfig } from '#vite/config'
import { Effect } from 'effect'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test.describe('Theme functionality', () => {
  test('starts with system theme preference', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/index.md': '# Hello' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory({}, project.layout.cwd),
    )
    const viteConfig = toViteUserConfig(polenConfig)
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    await page.goto(viteDevServer.url('/').href)

    // Check that no theme cookie is set initially
    const cookies = await page.context().cookies()
    const themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie).toBeUndefined()

    // Check that the html element has a theme applied (from system preference)
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', /(light|dark)/)
    const initialTheme = await htmlElement.getAttribute('data-theme')
    expect(initialTheme).toMatch(/^(light|dark)$/)
  })

  test('theme toggle creates cookie and persists on reload', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/index.md': '# Hello' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory({}, project.layout.cwd),
    )
    const viteConfig = toViteUserConfig(polenConfig)
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    await page.goto(viteDevServer.url('/').href)

    // Get initial theme
    const htmlElement = page.locator('html')
    const initialTheme = await htmlElement.getAttribute('data-theme')
    expect(initialTheme).toMatch(/^(light|dark)$/)

    // Find theme toggle button - when no cookie, it shows "Switch to light theme"
    const themeToggle = page.getByRole('button', { name: /Switch to light theme/i })
    await expect(themeToggle).toBeVisible()

    // Click the button
    await themeToggle.click()

    // Wait for DOM updates
    await page.waitForTimeout(300)

    // Check that theme has changed to light
    const newTheme = await htmlElement.getAttribute('data-theme')

    expect(newTheme).toBe('light')

    // Check that cookie was created
    const cookies = await page.context().cookies()
    const themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie).toBeDefined()
    expect(themeCookie?.value).toBe(newTheme)

    // Reload the page
    await page.reload()

    // Check that theme persists after reload
    await expect(htmlElement).toHaveAttribute('data-theme', newTheme!)

    // Check that the visual theme is applied
    await expect(htmlElement).toHaveClass(new RegExp(`radix-themes.*${newTheme}`))
  })

  test('theme toggle cycles through system, light, dark', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/index.md': '# Hello' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory({}, project.layout.cwd),
    )
    const viteConfig = toViteUserConfig(polenConfig)
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    // Start with no cookie (system preference)
    await page.goto(viteDevServer.url('/').href)

    const htmlElement = page.locator('html')
    const initialTheme = await htmlElement.getAttribute('data-theme')

    // Check no cookie is set initially
    let cookies = await page.context().cookies()
    let themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie).toBeUndefined()

    // First click: system → light
    let themeToggle = page.getByRole('button', { name: /Switch to light theme/i })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await page.waitForTimeout(300)

    await expect(htmlElement).toHaveAttribute('data-theme', 'light')
    cookies = await page.context().cookies()
    themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie?.value).toBe('light')

    // Second click: light → dark
    themeToggle = page.getByRole('button', { name: /Switch to dark theme/i })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await page.waitForTimeout(300)

    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')
    cookies = await page.context().cookies()
    themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie?.value).toBe('dark')

    // Third click: dark → system
    themeToggle = page.getByRole('button', { name: /Switch to system theme/i })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Theme should go back to system preference
    await expect(htmlElement).toHaveAttribute('data-theme', initialTheme!)

    // Cookie should be cleared
    cookies = await page.context().cookies()
    themeCookie = cookies.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie).toBeUndefined()
  })

  test('theme toggle updates cookie on subsequent clicks', async ({ page, vite, project }) => {
    await project.layout.set({ 'pages/index.md': '# Hello' })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory({}, project.layout.cwd),
    )
    const viteConfig = toViteUserConfig(polenConfig)
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    // Start with a dark theme cookie
    await page.context().addCookies([{
      name: 'polen-theme-preference',
      value: 'dark',
      domain: 'localhost',
      path: '/',
    }])

    await page.goto(viteDevServer.url('/').href)

    // Verify starting with dark theme
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Click theme toggle - should show "Switch to system theme" since we're in dark
    const themeToggle = page.getByRole('button', { name: /Switch to system theme/i })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Check theme changed to system preference (which should be light in tests)
    await expect(htmlElement).toHaveAttribute('data-theme', 'light')

    // Check cookie was cleared
    const cookies1 = await page.context().cookies()
    const themeCookie1 = cookies1.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie1).toBeUndefined()

    // Click again to go to light - button should now say "Switch to light theme"
    const themeToggleLight = page.getByRole('button', { name: /Switch to light theme/i })
    await expect(themeToggleLight).toBeVisible()
    await themeToggleLight.click()
    await page.waitForTimeout(300)

    // Check theme is still light
    await expect(htmlElement).toHaveAttribute('data-theme', 'light')

    // Check cookie was created
    const cookies2 = await page.context().cookies()
    const themeCookie2 = cookies2.find(c => c.name === 'polen-theme-preference')
    expect(themeCookie2?.value).toBe('light')
  })

  test('theme persists across different pages', async ({ page, vite, project }) => {
    await project.layout.set({
      'pages/index.md': '# Home',
      'pages/about.md': '# About',
      'pages/contact.md': '# Contact',
    })
    const polenConfig = await Effect.runPromise(
      Api.ConfigResolver.fromMemory({}, project.layout.cwd),
    )
    const viteConfig = toViteUserConfig(polenConfig)
    const viteDevServer = await vite.startDevelopmentServer(viteConfig)

    // Start with a dark theme cookie
    await page.context().addCookies([{
      name: 'polen-theme-preference',
      value: 'dark',
      domain: 'localhost',
      path: '/',
    }])

    // Visit home page
    await page.goto(viteDevServer.url('/').href)
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Navigate to about page
    await page.goto(viteDevServer.url('/about').href)
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Navigate to contact page
    await page.goto(viteDevServer.url('/contact').href)
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Toggle theme on contact page - should show "Switch to system theme" since we're in dark
    const themeToggle = page.getByRole('button', { name: /Switch to system theme/i })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Should go to system preference (light in tests)
    await expect(htmlElement).toHaveAttribute('data-theme', 'light')

    // Navigate back to home page
    await page.goto(viteDevServer.url('/').href)
    await expect(htmlElement).toHaveAttribute('data-theme', 'light')
  })
})

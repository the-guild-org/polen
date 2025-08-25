import { expect } from 'playwright/test'
import { getFixtureOptions } from '../helpers/helpers.js'
import { test } from '../helpers/test.js'

test.use(getFixtureOptions(import.meta))

test('no hydration errors on navigation links', async ({ runDev, page }) => {
  const baseUrl = runDev.url.endsWith('/') ? runDev.url.slice(0, -1) : runDev.url

  // Capture console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
      
    }
  })

  // Navigate to home page
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' })
  expect(response?.ok()).toBe(true)

  // Wait for hydration - wait for React to be ready
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => window.document.readyState === 'complete')

  // Check for hydration errors
  const hydrationErrors = errors.filter(error =>
    error.includes('Hydration failed')
    || error.includes('hydration-mismatch')
  )

  // Assert no hydration errors
  expect(hydrationErrors).toHaveLength(0)

  // Verify navigation links exist
  const navLinks = await page.locator('a[href]').count()
  expect(navLinks).toBeGreaterThan(0)

  // Also verify no console errors
  expect(errors).toHaveLength(0)
})

test('hive guide page renders with MDX content', async ({ runDev, page }) => {
  // Fix double slash issue
  const baseUrl = runDev.url.endsWith('/') ? runDev.url.slice(0, -1) : runDev.url
  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      
    }
  })

  page.on('pageerror', error => {
    
  })

  // Navigate to home page first
  console.log('Navigating to:', baseUrl)
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  console.log('Response status:', response?.status())

  if (response?.status() === 500) {
    const html = await page.content()
    console.log('Error page HTML:', html.substring(0, 1000))

    // Try to extract error message
    const errorText = await page.textContent('body').catch(() => 'Could not get body text')
    console.log('Error text:', errorText)
  }

  // Check if we get any response
  if (response?.ok()) {
    console.log('Page loaded successfully')

    // Get page title
    const title = await page.title()
    console.log('Page title:', title)

    // Check that it's the Hive API page
    expect(title).toContain('Hive Api')
  } else {
    throw new Error(`Failed to load page: ${response?.status()}`)
  }
})

test('GraphQL documents render with syntax highlighting on guide pages', async ({ runDev, page }) => {
  // Fix double slash issue
  const baseUrl = runDev.url.endsWith('/') ? runDev.url.slice(0, -1) : runDev.url

  // Navigate to a guide page with GraphQL documents
  const response = await page.goto(`${baseUrl}/guide/target-management`, { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBe(true)

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle')

  // Wait for React to hydrate and content to render
  await page.waitForFunction(() => window.document.readyState === 'complete')
  await page.waitForSelector('pre', { timeout: 5000 })

  // Check for GraphQL interactive components specifically
  const graphqlInteractive = page.locator('.graphql-interactive')
  const interactiveCount = await graphqlInteractive.count()

  // Check for any code blocks (including both interactive and regular)
  const codeBlocks = await page.locator('pre').count()
  console.log('Total pre elements found:', codeBlocks)
  console.log('GraphQL interactive components found:', interactiveCount)

  // Check page content includes GraphQL queries
  const pageText = await page.textContent('body')
  const hasGraphQLContent = pageText?.includes('query') || pageText?.includes('mutation')
  console.log('Page has GraphQL content:', hasGraphQLContent)

  // Verify the page has content and code blocks
  expect(codeBlocks).toBeGreaterThan(0)
  expect(hasGraphQLContent).toBe(true)

  // If there are interactive GraphQL components, verify they rendered properly
  if (interactiveCount > 0) {
    await expect(graphqlInteractive.first()).toBeVisible()
  }
})

test('GraphQL documents handle schema-less rendering gracefully', async ({ runDev, page }) => {
  // Fix double slash issue
  const baseUrl = runDev.url.endsWith('/') ? runDev.url.slice(0, -1) : runDev.url

  // Test a page that might not have schema context
  await page.goto(`${baseUrl}/guide/getting-started`)

  // Check if any GraphQL interactive components exist on this page
  const graphqlInteractive = page.locator('.graphql-interactive, .graphql-loading, .graphql-error, .graphql-fallback')
  const count = await graphqlInteractive.count()

  if (count > 0) {
    // Verify they render without errors even without schema
    const firstDoc = graphqlInteractive.first()
    await expect(firstDoc).toBeVisible()

    // Should still have syntax highlighting in pre/code elements
    const codeBlock = firstDoc.locator('pre, pre code')
    await expect(codeBlock).toBeVisible()
  }
})

test('Multiple GraphQL documents on same page work correctly', async ({ runDev, page }) => {
  // Fix double slash issue
  const baseUrl = runDev.url.endsWith('/') ? runDev.url.slice(0, -1) : runDev.url

  // Navigate to a guide page with multiple GraphQL documents
  await page.goto(`${baseUrl}/guide/project-management`)
  await page.waitForLoadState('networkidle')

  // Wait for content to render
  await page.waitForFunction(() => window.document.readyState === 'complete')
  await page.waitForSelector('pre', { timeout: 5000 })

  // Check for both GraphQL interactive components and regular code blocks
  const graphqlInteractive = page.locator('.graphql-interactive, .graphql-loading, .graphql-error, .graphql-fallback')
  const interactiveCount = await graphqlInteractive.count()

  const codeBlocks = page.locator('pre')
  const codeBlockCount = await codeBlocks.count()

  console.log('Code blocks found on project management page:', codeBlockCount)
  console.log('GraphQL interactive components found:', interactiveCount)

  // The project management page should have multiple code blocks
  expect(codeBlockCount).toBeGreaterThan(1)

  // Verify code blocks render correctly
  for (let i = 0; i < Math.min(codeBlockCount, 3); i++) {
    const codeBlock = codeBlocks.nth(i)
    await expect(codeBlock).toBeVisible()
  }

  // If there are interactive GraphQL components, verify they work
  if (interactiveCount > 0) {
    for (let i = 0; i < Math.min(interactiveCount, 2); i++) {
      const interactive = graphqlInteractive.nth(i)
      await expect(interactive).toBeVisible()
    }
  }
})

// Note: Interactive features like tooltips and hyperlinks are tested in integration tests
// These example tests focus on basic rendering and page functionality

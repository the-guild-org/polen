/**
 * E2E tests for GraphQL document interactive tooltips
 */

import { expect } from 'playwright/test'
import { test } from '../helpers/test.ts'

// GraphQL Document Tooltips E2E Tests
test.skip('should show tooltip on hover after delay', async ({ page }) => {
  // TODO: Implementation
  // 1. Navigate to a page with GraphQL document
  // 2. Hover over a type/field identifier
  // 3. Wait for tooltip to appear (300ms)
  // 4. Assert tooltip content includes type information
  // 5. Assert tooltip has correct positioning
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay').first()
  await identifier.hover()
  await page.waitForTimeout(350) // Show delay + buffer
  const tooltip = page.locator('.graphql-hover-tooltip')
  await expect(tooltip).toBeVisible()
})

test.skip('should hide tooltip when mouse leaves', async ({ page }) => {
  // TODO: Implementation
  // 1. Show a tooltip by hovering
  // 2. Move mouse away from identifier
  // 3. Wait for hide delay (100ms)
  // 4. Assert tooltip is hidden
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay').first()
  await identifier.hover()
  await page.waitForTimeout(350)
  await page.mouse.move(0, 0) // Move away
  await page.waitForTimeout(150) // Hide delay + buffer
  const tooltip = page.locator('.graphql-hover-tooltip')
  await expect(tooltip).not.toBeVisible()
})

test.skip('should keep tooltip open when hovering tooltip content', async ({ page }) => {
  // TODO: Implementation
  // 1. Show a tooltip by hovering identifier
  // 2. Move mouse to tooltip content
  // 3. Assert tooltip stays visible
  // 4. Click "View docs" link in tooltip
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay').first()
  await identifier.hover()
  await page.waitForTimeout(350)
  const tooltip = page.locator('.graphql-hover-tooltip')
  await tooltip.hover()
  await page.waitForTimeout(200)
  await expect(tooltip).toBeVisible()
})

test.skip('should pin tooltip on click', async ({ page }) => {
  // TODO: Implementation
  // 1. Click on identifier
  // 2. Assert tooltip appears and stays visible
  // 3. Move mouse away
  // 4. Assert tooltip is still visible (pinned)
  // 5. Click close button to unpin
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay').first()
  await identifier.click()
  const tooltip = page.locator('.graphql-hover-tooltip')
  await expect(tooltip).toBeVisible()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(200)
  await expect(tooltip).toBeVisible() // Still visible when pinned
  const closeButton = tooltip.locator('[aria-label="Close tooltip"]')
  await closeButton.click()
  await expect(tooltip).not.toBeVisible()
})

test.skip('should allow multiple pinned tooltips', async ({ page }) => {
  // TODO: Implementation
  // 1. Click first identifier to pin
  // 2. Click second identifier to pin
  // 3. Assert both tooltips are visible
  // 4. Close one tooltip
  // 5. Assert other tooltip is still visible
  await page.goto('/test/graphql-tooltips')
  const identifiers = page.locator('.graphql-identifier-overlay')
  await identifiers.nth(0).click()
  await identifiers.nth(1).click()
  const tooltips = page.locator('.graphql-hover-tooltip')
  await expect(tooltips).toHaveCount(2)
})

test.skip('should close all tooltips on escape key', async ({ page }) => {
  // TODO: Implementation
  // 1. Pin multiple tooltips
  // 2. Press Escape key
  // 3. Assert all tooltips are closed
  await page.goto('/test/graphql-tooltips')
  const identifiers = page.locator('.graphql-identifier-overlay')
  await identifiers.nth(0).click()
  await identifiers.nth(1).click()
  await page.keyboard.press('Escape')
  const tooltips = page.locator('.graphql-hover-tooltip')
  await expect(tooltips).toHaveCount(0)
})

test.skip('should show visual feedback for clickable identifiers', async ({ page }) => {
  // TODO: Implementation
  // 1. Navigate to page with GraphQL document
  // 2. Assert clickable identifiers have underline effect
  // 3. Hover over identifier
  // 4. Assert hover state shows background color
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay.graphql-clickable').first()
  await expect(identifier).toHaveCSS('box-shadow', /rgba/)
  await identifier.hover()
  await expect(identifier).toHaveCSS('background-color', /rgba/)
})

test.skip('should handle touch devices with click-only behavior', async ({ page }) => {
  // TODO: Implementation
  // TODO: Add mobile detection
  // test.skip(!isMobile, 'Mobile only test')

  // 1. On touch device, hover should not show tooltip
  // 2. Click/tap should show tooltip
  // 3. Tap elsewhere should close unpinned tooltip
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('.graphql-identifier-overlay').first()
  // Touch devices don't have hover
  await identifier.tap()
  const tooltip = page.locator('.graphql-hover-tooltip')
  await expect(tooltip).toBeVisible()
})

test.skip('should show error state for undefined types', async ({ page }) => {
  // TODO: Implementation
  // 1. Navigate to page with invalid GraphQL
  // 2. Hover over undefined type
  // 3. Assert error tooltip appears
  // 4. Assert error styling on identifier
  await page.goto('/test/graphql-tooltips-errors')
  const errorIdentifier = page.locator('.graphql-identifier-overlay.graphql-error').first()
  await expect(errorIdentifier).toHaveCSS('box-shadow', /red/)
  await errorIdentifier.hover()
  await page.waitForTimeout(350)
  const tooltip = page.locator('.graphql-hover-tooltip')
  await expect(tooltip).toContainText('not found in schema')
})

test.skip('should navigate to reference docs on identifier click', async ({ page }) => {
  // TODO: Implementation
  // 1. Click on valid type identifier link
  // 2. Assert navigation to reference page
  // 3. Or click "View docs" in tooltip
  await page.goto('/test/graphql-tooltips')
  const identifier = page.locator('a.graphql-identifier-overlay.graphql-clickable').first()
  const href = await identifier.getAttribute('href')
  expect(href).toContain('/reference/')
  // Test navigation through tooltip
  await identifier.click() // Pin tooltip
  const viewDocsLink = page.locator('.graphql-hover-tooltip a').filter({ hasText: 'View full documentation' })
  await viewDocsLink.click()
  await expect(page).toHaveURL(/\/reference\//)
})

test.skip('should handle rapid hover changes gracefully', async ({ page }) => {
  // TODO: Implementation
  // 1. Quickly hover between multiple identifiers
  // 2. Assert only last hovered tooltip shows
  // 3. Assert no flickering or multiple tooltips
  await page.goto('/test/graphql-tooltips')
  const identifiers = page.locator('.graphql-identifier-overlay')
  await identifiers.nth(0).hover()
  await page.waitForTimeout(100)
  await identifiers.nth(1).hover()
  await page.waitForTimeout(100)
  await identifiers.nth(2).hover()
  await page.waitForTimeout(350)
  const tooltips = page.locator('.graphql-hover-tooltip')
  await expect(tooltips).toHaveCount(1)
})

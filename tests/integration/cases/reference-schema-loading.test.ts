import { expect } from 'playwright/test'
import { polen } from '../helpers/polen-builder.js'
import { test } from '../helpers/test.js'

test('reference pages should load schema content correctly', async ({ page, vite }) => {
  const builder = polen(page, vite).withPokemonSchema()
  
  const p = await builder.goto('/reference/Pokemon')
  
  // Should not show schema missing error
  await p.expect.noErrors()
  
  // Should show the actual Pokemon type content
  await expect(page.getByRole('heading', { name: 'Pokemon' })).toBeVisible()
  await expect(page.getByText('No content to show. There is no schema to work with.')).not.toBeVisible()
  
  // Should show some fields from Pokemon type (being more specific to avoid multiple matches)
  await expect(page.locator('.rt-Text.rt-r-weight-medium').filter({ hasText: 'id' })).toBeVisible()
  await expect(page.locator('.rt-Text.rt-r-weight-medium').filter({ hasText: 'name' })).toBeVisible()
})

test('reference index page should work', async ({ page, vite }) => {
  const builder = polen(page, vite).withPokemonSchema()
  
  const p = await builder.goto('/reference')
  
  await p.expect.noErrors()
  await expect(page.getByText('Select a type from the sidebar')).toBeVisible()
  await expect(page.getByText('No content to show. There is no schema to work with.')).not.toBeVisible()
})
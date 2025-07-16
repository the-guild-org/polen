import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

test('reference pages should load schema content correctly', async ({ page, polen }) => {
  const builder = polen.withPokemonSchema()

  const p = await builder.goto('/reference/Pokemon')

  // Should not show schema missing error
  await p.expect.noErrors()

  // Should show the actual Pokemon type content
  await expect(page.getByRole('heading', { name: 'Pokemon' })).toBeVisible()
  await expect(page.getByText('No content to show. There is no schema to work with.')).not.toBeVisible()

  // Should show Fields section
  await expect(page.getByRole('heading', { name: 'Fields' })).toBeVisible()

  // Should show field names (using id attributes that are already on field containers)
  // TODO: Consider adding data-testid attributes for more explicit test selectors
  await expect(page.locator('#id')).toBeVisible()
  await expect(page.locator('#name')).toBeVisible()

  // Verify field details are shown within their containers (more robust than global text search)
  const idField = page.locator('#id')
  await expect(idField.getByText('id:', { exact: false })).toBeVisible()
  await expect(idField.getByText('ID!')).toBeVisible()

  const nameField = page.locator('#name')
  await expect(nameField.getByText('name:', { exact: false })).toBeVisible()
  await expect(nameField.getByText('String!')).toBeVisible()
})

test('reference index page should work', async ({ page, polen }) => {
  const builder = polen.withPokemonSchema()

  const p = await builder.goto('/reference')

  await p.expect.noErrors()
  await expect(page.getByText('Select a type from the sidebar')).toBeVisible()
  await expect(page.getByText('No content to show. There is no schema to work with.')).not.toBeVisible()
})

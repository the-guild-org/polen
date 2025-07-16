import { polen } from '../helpers/polen-builder.js'
import { test } from '../helpers/test.js'

test('basic schema navigation works', async ({ page, vite }) => {
  await polen(page, vite)
    .withSchema('type Query { hello: String }')
    .goto('/reference')
    .then(p => p.expect.visible('Query'))
})

test('version picker updates correctly', async ({ page, vite }) => {
  await polen(page, vite)
    .withVersions([
      '2023-01-01T00:00:00.000Z: type Query { old: String }',
      '2023-02-01T00:00:00.000Z: type Query { newField: String }',
    ])
    .goto('/reference')
    .then(async p => {
      await p.selectVersion('2022-12-31') // Timezone offset makes 2023-01-01 UTC become 2022-12-31
      await p.expect.url('/reference/version/2022-12-31')
    })
})

test('base path asset loading works', async ({ page, vite }) => {
  await polen(page, vite)
    .withSchema('type Query { hello: String }')
    .withBasePath('/demos/test/')
    .goto('/reference')
    .then(p => p.expect.noErrors())
})

test('sidebar links preserve version context', async ({ page, vite }) => {
  await polen(page, vite)
    .withVersions([
      '2023-01-01T00:00:00.000Z: type Query { hello: String }',
      '2023-02-01T00:00:00.000Z: type Query { world: String }',
    ])
    .goto('/reference/version/2022-12-31') // Timezone offset makes 2023-01-01 UTC become 2022-12-31
    .then(p => p.expect.sidebarLinks('version/2022-12-31'))
})

test('BUGFIX: version picker does not duplicate after navigation', async ({ page, vite }) => {
  const builder = polen(page, vite).withPokemonSchema()

  await builder
    .goto('/reference')
    .then(async p => {
      // Check there's exactly one version picker initially
      await p.expect.versionPickerCount(1)

      // Navigate to a versioned type page - this triggers the duplication bug
      await p.selectVersion(builder.refs.oldVersion)
      await p.expect.versionPickerCount(1)

      // Navigate to a specific type - this is where duplication occurs
      await p.clickLink(builder.refs.types[1]!) // Pokemon
      await p.expect.versionPickerCount(1) // This should pass but currently fails with 2
    })
})

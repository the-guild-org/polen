import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'

const schemaFixtures = {
  minimal: {
    v1: 'type Query { v1: Boolean }',
    v2: 'type Query { v2: Boolean }',
    v3: 'type Query { v3: Boolean }',
  },
}

test('starts and stops dev without error', async ({ vite }) => {
  await vite.devPolen()
})

test('no schema causes navbar without refernce link', async ({ page, vite }) => {
  await vite.devPolen()
  const svr = await vite.devPolen()
  await page.goto(svr.url('/').href, { timeout: 5000 })
  expect(await page.getByRole('link').allInnerTexts()).toEqual(['Project'])
})

test('schema pressence causes navbar with reference link', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': schemaFixtures.minimal.v1,
  })
  const svr = await vite.devPolen()
  await page.goto(svr.url('/').href, { timeout: 1000_0 })
  // With the new home page, we have both navbar links and Hero CTA buttons
  expect(await page.getByRole('link').allInnerTexts()).toEqual(['Project', 'Reference', 'View Reference'])
})

test('/reference loads unversioned schema without error', async ({ page, vite, project }) => {
  await project.layout.set({
    'schema.graphql': schemaFixtures.minimal.v1,
  })
  const svr = await vite.devPolen()
  await page.goto(svr.url('/reference').href, { timeout: 1000_0 })
  expect(svr.logs.errors).toEqual([])
})

test('/reference loads versioned schema without error', async ({ page, vite, project }) => {
  await project.layout.set({
    'schemas': {
      '3.0.0': schemaFixtures.minimal.v1,
      '2.0.0': schemaFixtures.minimal.v2,
      '1.0.0': schemaFixtures.minimal.v3,
    },
  })
  const svr = await vite.devPolen()
  await page.goto(svr.url('/reference').href, { timeout: 1000_0 })
  expect(svr.logs.errors).toEqual([])
  // console.log(svr.logs.all)
})

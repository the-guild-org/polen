import type { Page } from 'playwright/test'
import { expect } from 'playwright/test'
import type { Config } from '../../../src/api/config/index.js'
import { getFixtureOptions } from '../helpers/helpers.js'
import { test } from '../helpers/test.js'

test.use(getFixtureOptions(import.meta))

const testPageHome = async (page: Page, polenConfig: Config.Config) => {
  await expect(page.getByText(polenConfig.templateVariables.title)).toBeVisible()
  await expect(page.title()).resolves.toContain(polenConfig.templateVariables.title)
}

test('development server renders app', async ({ runDev, page, project }) => {
  await page.goto(runDev.url)
  await testPageHome(page, project.config._polen)
})

test('built server renders app', async ({ page, runStart, project }) => {
  await page.goto(runStart.url)
  await testPageHome(page, project.config._polen)
})

// Skip SSG test for GitHub example - schema too large (1600+ types) for efficient SSG
test.skip('static site generation renders app', async ({ project, runServeSsg, page }) => {
  await page.goto(runServeSsg.url)
  await testPageHome(page, project.config._polen)
})

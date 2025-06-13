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

test('development server renders app', async ({ project, runDev, page }) => {
  await page.goto(runDev.url)
  await testPageHome(page, project.config._polen)
})

test('built server renders app', async ({ project, runStart, page }) => {
  await page.goto(runStart.url)
  await testPageHome(page, project.config._polen)
})

test('static site generation renders app', async ({ project, runServeSsg, page }) => {
  await page.goto(runServeSsg.url)
  await testPageHome(page, project.config._polen)
})

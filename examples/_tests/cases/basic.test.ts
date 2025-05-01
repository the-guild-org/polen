import type { Page } from 'playwright/test'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'
import { getFixtureOptions } from '../helpers/helpers.js'
import type { Configurator } from '../../../src/api/configurator/index.js'

test.use(getFixtureOptions(import.meta))

const testPageHome = async (page: Page, polenConfig: Configurator.Config) => {
  await expect(page.getByText(polenConfig.templateVariables.title)).toBeVisible()
  await expect(page.title()).resolves.toContain(polenConfig.templateVariables.title)
}

test(`development server renders app`, async ({ project, runDev, page }) => {
  await page.goto(runDev.url)
  await testPageHome(page, project.config._polen.normalized)
})

test(`built server renders app`, async ({ project, runStart, page }) => {
  await page.goto(runStart.url)
  await testPageHome(page, project.config._polen.normalized)
})

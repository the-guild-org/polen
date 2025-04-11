import type { Page } from 'playwright/test'
import { expect } from 'playwright/test'
import { test } from '../helpers/test.js'
import { getFixtureOptions } from '../helpers/helpers.js'
import type { Configurator } from '../../../src/configurator/_namespace.js'

test.use(getFixtureOptions(import.meta))

const testPageHome = async (page: Page, polenConfig: Configurator.Config) => {
  await expect(page.getByText(polenConfig.templateVariables.title)).toBeVisible()
  await expect(page.title()).resolves.toContain(polenConfig.templateVariables.title)
}

test.only(`development server renders app`, async ({ runDev, page, polenConfig }) => {
  await page.goto(runDev.url)
  await testPageHome(page, polenConfig)
})

test(`built server renders app`, async ({ page, runStart, polenConfig }) => {
  await page.goto(runStart.url)
  await testPageHome(page, polenConfig)
})

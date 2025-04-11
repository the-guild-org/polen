import type { Page } from 'playwright/test'
import { expect } from 'playwright/test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from '../helpers/test.js'

const exampleName = `github-developer-portal`
const dirname = path.dirname(fileURLToPath(import.meta.url))
const exampleDir = path.resolve(dirname, `../../${exampleName}`)
const cwd = exampleDir

test.use({ cwd })

const testPageHome = async (page: Page) => {
  await expect(page.getByText(`GitHub Developer Portal`)).toBeVisible()
  await expect(page.title()).resolves.toContain(`GitHub Developer Portal`)
}

test(`development server renders app`, async ({ runDev, page }) => {
  await page.goto(runDev.url)
  await testPageHome(page)
})

test(`built server renders app`, async ({ page, runStart }) => {
  await page.goto(runStart.url)
  await testPageHome(page)
})

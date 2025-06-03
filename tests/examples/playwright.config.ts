import { PackageManager } from '@wollybeard/kit'
import { defineConfig, devices } from 'playwright/test'
import type { WorkerFixtures } from './helpers/test.js'
import { type TestFixtures } from './helpers/test.js'

const isCi = !!process.env[`CI`]

const polenLink = process.env[`POLEN_LINK`]
  ? PackageManager.LinkProtocol.parse(process.env[`POLEN_LINK`])
  : isCi
  ? PackageManager.LinkProtocol.enum.file
  : PackageManager.LinkProtocol.enum.file

export default defineConfig<TestFixtures, WorkerFixtures>({
  name: `examples`,
  testDir: `./cases`,
  forbidOnly: isCi,
  maxFailures: 1,
  retries: 0,
  outputDir: `./__results__`,
  use: {
    trace: `on-first-retry`,
    screenshot: isCi ? `only-on-failure` : `off`,
    video: isCi ? `retain-on-failure` : `off`,
    polenLink,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

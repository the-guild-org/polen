import { defineConfig, devices } from 'playwright/test'
import type { WorkerFixtures } from './helpers/test.js'
import { type TestFixtures } from './helpers/test.js'
import { parsePolenSource } from './helpers/polen-source.js'

const isCi = !!process.env[`CI`]
const polenSource = process.env[`POLEN_SOURCE`]
  ? parsePolenSource(process.env[`POLEN_SOURCE`])
  : isCi
  ? `localFile`
  : undefined

export default defineConfig<TestFixtures, WorkerFixtures>({
  name: `examples`,
  testDir: `./cases`,
  forbidOnly: isCi,
  maxFailures: 1,
  retries: 0,
  outputDir: `./__results__`,
  use: {
    trace: `on-first-retry`,
    screenshot: `only-on-failure`,
    polenSource,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

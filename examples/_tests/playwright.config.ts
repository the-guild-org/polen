import { defineConfig, devices } from 'playwright/test'
import type { WorkerFixtures } from './helpers/test.js'
import { type TestFixtures } from './helpers/test.js'
import { Ver, VerEnum } from './helpers/ver.js'

const isCi = !!process.env[`CI`]
const polenVer = process.env[`POLEN_VER`]
  ? Ver.parse(process.env[`POLEN_VER`])
  : isCi
  ? VerEnum.file
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
    polenVer,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

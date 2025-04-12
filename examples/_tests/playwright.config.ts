import { defineConfig, devices } from 'playwright/test'
import type { Fixtures } from './helpers/test.js'

const isCi = !!process.env[`CI`]

export default defineConfig<Fixtures>({
  name: `examples`,
  testDir: `./cases`,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 0 : 0,
  workers: isCi ? 1 : undefined,
  outputDir: `./__results__`,
  // reporter: `html`,
  use: {
    trace: `on-first-retry`,
    screenshot: `only-on-failure`,
    polenSource: isCi ? `localFile` : undefined,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

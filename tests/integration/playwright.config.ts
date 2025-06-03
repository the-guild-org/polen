import { defineConfig, devices } from 'playwright/test'

const isCi = !!process.env[`CI`]

export default defineConfig({
  name: `examples`,
  testDir: `./cases`,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0, // isCi ? 2 : 0,
  maxFailures: isCi ? undefined : 1,
  workers: isCi ? 1 : undefined,
  outputDir: `./__results__`,
  use: {
    trace: `on-first-retry`,
    screenshot: isCi ? `only-on-failure` : `off`,
    video: isCi ? `retain-on-failure` : `off`,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

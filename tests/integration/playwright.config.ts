import { defineConfig, devices } from 'playwright/test'

const isCi = !!process.env[`CI`]

export default defineConfig({
  name: `examples`,
  testDir: `./cases`,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  outputDir: `./__results__`,
  use: {
    trace: `on-first-retry`,
    screenshot: `only-on-failure`,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

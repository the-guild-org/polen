import { defineConfig, devices } from 'playwright/test'

const isCi = !!process.env[`CI`]

export default defineConfig({
  name: `examples`,
  testDir: `./cases`,
  testMatch: `*.ts`,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  outputDir: `./__results__`,
  // reporter: `html`,
  // use: {
  //   baseURL: `http://localhost:5173`,
  //   trace: `on-first-retry`,
  //   screenshot: `only-on-failure`,
  // },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
  // webServer: {
  //   // We don't use the webServer config as we need more complex server management
  //   // in our tests. Server starting and stopping is handled within the test files.
  //   reuseExistingServer: true,
  // },
})

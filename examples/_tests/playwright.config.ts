import { defineConfig, devices } from 'playwright/test'
import { type Fixtures, parsePolenSource } from './helpers/test.js'

const isCi = !!process.env[`CI`]
const polenSource = process.env[`POLEN_SOURCE`]
  ? parsePolenSource(process.env[`POLEN_SOURCE`])
  : isCi
  ? `localFile`
  : undefined

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
    polenSource,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

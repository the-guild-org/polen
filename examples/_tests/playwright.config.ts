import { defineConfig, devices } from 'playwright/test'
import type { WorkerFixtures } from './helpers/test.js'
import { type TestFixtures } from './helpers/test.js'
import { LinkProtocol } from '../../src/lib/link-protocol.js'

const isCi = !!process.env[`CI`]
const polenLink = process.env[`POLEN_LINK`]
  ? LinkProtocol.parse(process.env[`POLEN_LINK`])
  : isCi
  ? LinkProtocol.enum.file
  : LinkProtocol.enum.file

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
    polenLink,
  },
  projects: [
    {
      name: `chromium`,
      use: { ...devices[`Desktop Chrome`] },
    },
  ],
})

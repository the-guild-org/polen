import { PackageManager } from '@wollybeard/kit'
import { defineConfig, devices } from 'playwright/test'

const isCi = !!process.env[`CI`]

const polenLink = process.env[`POLEN_LINK`]
  ? PackageManager.LinkProtocol.parse(process.env[`POLEN_LINK`])
  : isCi
  ? PackageManager.LinkProtocol.enum.file
  : PackageManager.LinkProtocol.enum.file

export default defineConfig({
  outputDir: `./__results__`,
  forbidOnly: isCi,
  retries: 0,
  maxFailures: isCi ? undefined : 1,
  workers: isCi ? 1 : 1,
  use: {
    trace: `on-first-retry`,
    screenshot: isCi ? `only-on-failure` : `off`,
    video: isCi ? `retain-on-failure` : `off`,
  },
  projects: [
    {
      name: `integration`,
      testDir: `./integration/cases`,
      outputDir: `./integration/__results__`,
      use: {
        ...devices[`Desktop Chrome`],
      },
    },
    {
      name: `examples`,
      testDir: `./examples/cases`,
      outputDir: `./examples/__results__`,
      use: {
        ...devices[`Desktop Chrome`],
        // Type assertion needed due to fixture types
        // @ts-expect-error
        polenLink: polenLink as any,
      },
    },
  ],
})

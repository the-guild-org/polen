import { PackageManager } from '@wollybeard/kit'
import { defineConfig, devices } from 'playwright/test'

const isCi = !!process.env[`CI`]

const polenLink = process.env[`POLEN_LINK`]
  ? PackageManager.LinkProtocol.parse(process.env[`POLEN_LINK`])
  : isCi
  ? PackageManager.LinkProtocol.enum.file
  : PackageManager.LinkProtocol.enum.file

export default defineConfig({
  forbidOnly: isCi,
  retries: 0,
  outputDir: `./__results__`,
  maxFailures: isCi ? undefined : 1,
  workers: isCi ? 1 : undefined,
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
      fullyParallel: true,
    },
    {
      name: `examples`,
      testDir: `./examples/cases`,
      outputDir: `./examples/__results__`,
      use: {
        ...devices[`Desktop Chrome`],
        // Type assertion needed due to fixture types
        // @ts-expect-error
        // eslint-disable-next-line
        polenLink: polenLink as any,
      },
    },
  ],
})

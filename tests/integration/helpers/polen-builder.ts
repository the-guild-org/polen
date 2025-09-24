import type { Polen } from '#exports/index'
import { FsLoc } from '@wollybeard/kit'
import type { Page } from 'playwright/test'
import { expect } from 'playwright/test'
import type { WritableDeep } from 'type-fest'
import { configMemorySchema, configMemorySchemaRevisions, pc } from './polen.js'
import type { ViteController } from './vite-controller/index.js'

interface PolenAssertions {
  visible(text: string): Promise<void>
  sidebarLinks(pattern: string): Promise<void>
  noErrors(): Promise<void>
  url(pattern: string): Promise<void>
  versionPickerCount(expectedCount: number): Promise<void>
}

export class PolenBuilder {
  private config: WritableDeep<Polen.ConfigInput> = {}
  private server?: ViteController.ViteDevServerPlus
  private cwd: FsLoc.AbsDir.AbsDir

  constructor(
    private page: Page,
    private vite: ViteController.ViteController,
    cwd: FsLoc.AbsDir.AbsDir,
  ) {
    this.cwd = cwd
  }

  // Configuration builders
  withSchema(sdl: string): PolenBuilder {
    this.config.schema = configMemorySchema(sdl) as WritableDeep<Polen.ConfigInput[`schema`]>
    return this
  }

  withPokemonSchema(): PolenBuilder & { refs: { types: string[]; oldVersion: string; newVersion: string } } {
    // Common test fixture with multiple versions
    this.withVersions([
      '2023-01-01T00:00:00.000Z: type Query { pokemon(name: String): Pokemon } type Pokemon { id: ID! name: String! }',
      '2023-07-08T00:00:00.000Z: type Query { pokemon(name: String): Pokemon pokemons: [Pokemon!]! } type Pokemon { id: ID! name: String! type: String! }',
    ])

    // Return builder with references to avoid magic strings
    return Object.assign(this, {
      refs: {
        types: ['Query', 'Pokemon'],
        oldVersion: '2022-12-31', // Timezone adjusted
        newVersion: 'Latest',
      },
    })
  }

  withVersions(versions: string[]): PolenBuilder {
    const parsedVersions = versions.map(v => {
      const separatorIndex = v.indexOf(': ')
      if (separatorIndex === -1) {
        throw new Error(`Invalid version string format in test setup. Expected "date: sdl", but got: "${v}"`)
      }
      const dateStr = v.substring(0, separatorIndex)
      const sdl = v.substring(separatorIndex + 2).trim()
      return {
        date: new Date(dateStr),
        sdl,
      }
    })
    this.config.schema = configMemorySchemaRevisions(parsedVersions) as WritableDeep<Polen.ConfigInput[`schema`]>
    return this
  }

  withBasePath(basePath: string): PolenBuilder {
    this.config.build = { ...this.config.build, base: basePath }
    return this
  }

  // Navigation actions
  async goto(path: string): Promise<PolenBuilderWithPage> {
    if (!this.server) {
      const viteUserConfig = await pc(this.config, this.cwd)
      this.server = await this.vite.startDevelopmentServer(viteUserConfig)
    }

    await this.page.goto(this.server.url(path).href)
    return new PolenBuilderWithPage(this.page, this.server)
  }
}

export class PolenBuilderWithPage {
  constructor(
    private page: Page,
    private server: ViteController.ViteDevServerPlus,
  ) {}

  // Navigation actions
  async selectVersion(version: string): Promise<PolenBuilderWithPage> {
    await this.page.getByRole('combobox').click()
    await this.page.getByRole('option', { name: version }).click()

    // Wait for navigation to complete (handles async React Router navigation)
    if (version !== 'Latest') {
      await this.page.waitForURL(new RegExp(`/reference/version/${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    }
    return this
  }

  async clickLink(text: string): Promise<PolenBuilderWithPage> {
    await this.page.getByRole('link', { name: text }).click()
    return this
  }

  // Assertions
  get expect(): PolenAssertions {
    return {
      visible: async (text: string) => {
        // Try to find the text in various contexts - could be with type indicators like "O Query"
        const element = this.page.getByText(text, { exact: false })
        await expect(element.first()).toBeVisible()
      },

      sidebarLinks: async (pattern: string) => {
        // Check that sidebar links match the expected pattern
        const links = await this.page.locator('[data-testid="sidebar"] a').all()
        const hrefs = await Promise.all(links.map(l => l.getAttribute('href')))
        const matchingLinks = hrefs.filter(href => href?.includes(pattern))
        expect(matchingLinks.length).toBeGreaterThan(0)
      },

      noErrors: async () => {
        // Check for ENOENT errors and console errors
        const errorText = await this.page.locator('text=ENOENT').count()
        expect(errorText).toBe(0)

        const errorElement = await this.page.locator('text=Unexpected Application Error').count()
        expect(errorElement).toBe(0)
      },

      url: async (pattern: string) => {
        expect(this.page.url()).toMatch(new RegExp(pattern))
      },

      versionPickerCount: async (expectedCount: number) => {
        // Count version picker elements (Radix Select.Root components with combobox role)
        const versionPickers = await this.page.locator('[role="combobox"]').count()
        expect(versionPickers).toBe(expectedCount)
      },
    }
  }
}

// Factory function for tests
export const polen = (page: Page, vite: ViteController.ViteController, cwd: FsLoc.AbsDir.AbsDir) =>
  new PolenBuilder(page, vite, cwd)

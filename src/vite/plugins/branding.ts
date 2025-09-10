import type { Api } from '#api/$'
import type { Vite } from '#dep/vite/index'
import { type ExistenceDiff, getMutationType, MutationType } from '#lib/mutation-type'
import { debugPolen } from '#singletons/debug'
import { Fs } from '@wollybeard/kit'
import * as Path from 'node:path'
import type { Plugin } from 'vite'
import { polenVirtual } from '../vi.js'

const viLogo = polenVirtual([`project`, `assets`, `logo.svg`])
const viHero = polenVirtual([`project`, `assets`, `hero`])

const generateDefaultLogo = async () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="48" fill="none" stroke="black" stroke-width="8"/>
</svg>`
}

const findLogoPath = async (publicDir: string, filename: string): Promise<string | null> => {
  const extensions = ['svg', 'png', 'jpg', 'jpeg', 'webp']
  for (const ext of extensions) {
    const path = Path.join(publicDir, `${filename}.${ext}`)
    if (await Fs.exists(path)) {
      return path
    }
  }
  return null
}

const findHeroImagePath = async (publicDir: string): Promise<string | null> => {
  const heroImageNames = [
    'hero.svg',
    'hero.png',
    'hero.jpg',
    'hero.jpeg',
    'hero.webp',
  ]

  for (const imageName of heroImageNames) {
    const imagePath = Path.join(publicDir, imageName)
    if (await Fs.exists(imagePath)) {
      return imagePath
    }
  }

  return null
}

export function Branding(config: Api.Config.Config): Plugin {
  const debug = debugPolen.sub(`vite-plugin:branding`)
  debug(`initialized`)

  // Track logo paths and hero image path for watch/HMR
  let logoLightPath: string | null = null
  let logoDarkPath: string | null = null
  let logoSinglePath: string | null = null
  let currentHeroImagePath: string | null = null

  return {
    name: `polen:branding`,
    enforce: `pre`,

    async buildStart() {
      // Check for logo files and add to watch
      const publicDir = config.paths.project.absolute.public.root

      // Check for dual mode (logo-light and logo-dark)
      logoLightPath = await findLogoPath(publicDir, 'logo-light')
      logoDarkPath = await findLogoPath(publicDir, 'logo-dark')

      // Check for single mode (logo)
      if (!logoLightPath || !logoDarkPath) {
        logoSinglePath = await findLogoPath(publicDir, 'logo')
      }

      // Add logo files to watch
      if (logoLightPath) this.addWatchFile(logoLightPath)
      if (logoDarkPath) this.addWatchFile(logoDarkPath)
      if (logoSinglePath) this.addWatchFile(logoSinglePath)
      // Also watch the default logo path for compatibility
      this.addWatchFile(config.paths.project.absolute.public.logo)

      // Watch for hero image files
      const heroImagePath = await findHeroImagePath(config.paths.project.absolute.public.root)
      if (heroImagePath) {
        currentHeroImagePath = heroImagePath
        this.addWatchFile(heroImagePath)
      }
    },

    async handleHotUpdate({ file, server }) {
      // Handle logo changes - check all possible logo files
      if (
        (logoLightPath && file === logoLightPath)
        || (logoDarkPath && file === logoDarkPath)
        || (logoSinglePath && file === logoSinglePath)
        || file === config.paths.project.absolute.public.logo
      ) {
        // Invalidate the logo module when any logo file changes
        const module = server.moduleGraph.getModuleById(viLogo.resolved)
        if (module) {
          server.moduleGraph.invalidateModule(module)
          return []
        }
      }

      // Handle hero image changes
      if (currentHeroImagePath && file === currentHeroImagePath) {
        return await handleWatchedFileChange({
          watchedFile: currentHeroImagePath,
          changedFile: file,
          moduleId: viHero.resolved,
          server,
          debug: debug,
        })
      }
    },

    resolveId(id) {
      if (id === viLogo.id) {
        return viLogo.resolved
      }
      if (id === viHero.id) {
        return viHero.resolved
      }
    },

    async load(id) {
      if (id === viLogo.resolved) {
        const publicDir = config.paths.project.absolute.public.root

        // Re-check for logos in case they changed
        const lightPath = await findLogoPath(publicDir, 'logo-light')
        const darkPath = await findLogoPath(publicDir, 'logo-dark')
        const singlePath = await findLogoPath(publicDir, 'logo')

        // Dual mode: both logo-light and logo-dark exist
        if (lightPath && darkPath) {
          const basePath = config.build.base || '/'
          const lightUrl = basePath === '/' ? `/${Path.basename(lightPath)}` : `${basePath}/${Path.basename(lightPath)}`
          const darkUrl = basePath === '/' ? `/${Path.basename(darkPath)}` : `${basePath}/${Path.basename(darkPath)}`
          return `export default {
            light: ${JSON.stringify(lightUrl)},
            dark: ${JSON.stringify(darkUrl)},
            mode: 'dual',
            designedFor: ${JSON.stringify(config.branding.logoDesignedFor)}
          }`
        }

        // Single mode: only logo.* exists
        if (singlePath) {
          const basePath = config.build.base || '/'
          const url = basePath === '/' ? `/${Path.basename(singlePath)}` : `${basePath}/${Path.basename(singlePath)}`
          return `export default {
            light: ${JSON.stringify(url)},
            dark: ${JSON.stringify(url)},
            mode: 'single',
            designedFor: ${JSON.stringify(config.branding.logoDesignedFor)}
          }`
        }

        // No logo files - use generated default
        const content = await generateDefaultLogo()
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(content).toString(`base64`)}`
        return `export default {
          light: ${JSON.stringify(dataUrl)},
          dark: ${JSON.stringify(dataUrl)},
          mode: 'single',
          designedFor: 'light'
        }`
      }

      if (id === viHero.resolved) {
        const heroImagePath = await findHeroImagePath(config.paths.project.absolute.public.root)
        if (heroImagePath) {
          currentHeroImagePath = heroImagePath
          // Just return the public URL path, let Vite handle the asset
          const basePath = config.build.base || '/'
          const publicPath = basePath === '/' ? `/${Path.basename(heroImagePath)}` : `${basePath}/${Path.basename(heroImagePath)}`
          return `export default ${JSON.stringify(publicPath)}`
        }
        return `export default null`
      }
    },
  }
}

interface HandleWatchedFileChangeParams {
  watchedFile: string
  changedFile: string
  moduleId: string
  server: Vite.ViteDevServer
  debug: (msg: string, data?: any) => void
}

const handleWatchedFileChange = async (
  params: HandleWatchedFileChangeParams,
): Promise<Vite.ModuleNode[] | void> => {
  const { watchedFile, changedFile, moduleId, server, debug } = params

  // Check if change is for watched file
  if (changedFile !== watchedFile) return

  // Check current existence
  const existsNow = await Fs.exists(watchedFile)

  // Check previous existence via module graph
  const module = server.moduleGraph.getModuleById(moduleId)
  const existedBefore = !!module

  // Early return if no mutation
  if (!existedBefore && !existsNow) {
    debug(`no mutation detected - file didn't exist before or after`, { file: changedFile })
    return
  }

  const mutationType = getMutationType({
    before: existedBefore,
    after: existsNow,
  } as ExistenceDiff)

  debug(`file ${mutationType}`, { file: changedFile })

  switch (mutationType) {
    case MutationType.Create:
      // Full reload needed - module never existed
      server.ws.send({
        type: `full-reload`,
        path: `*`,
      })
      break

    case MutationType.Update:
    case MutationType.Delete:
      // Invalidate module for HMR
      server.moduleGraph.invalidateModule(module!)
      // Return empty array to prevent default HMR
      return []
  }
}

import type { Config } from '#api/api'
import { polenVirtual } from '#api/vite/vi'
import { debugPolen } from '#singletons/debug'
import { Fs } from '@wollybeard/kit'
import type { Plugin } from 'vite'

const viLogo = polenVirtual([`project`, `assets`, `logo.svg`])

const generateDefaultLogo = async () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="48" fill="none" stroke="black" stroke-width="8"/>
</svg>`
}

export interface Options {
  config: Config.Config
}

export function Branding({ config }: Options): Plugin {
  const debug = debugPolen.sub(`vite-plugin:branding`)
  debug(`initialized`)

  return {
    name: `polen:branding`,
    enforce: `pre`,

    async buildStart() {
      this.addWatchFile(config.paths.project.absolute.public.logo)
    },

    async hotUpdate({ file, type }) {
      if (file !== config.paths.project.absolute.public.logo) return

      debug(`hotUpdate`, { file, type })

      const module = this.environment.moduleGraph.getModuleById(viLogo.resolved)
      if (module) {
        this.environment.moduleGraph.invalidateModule(module)
      }

      return []
    },

    resolveId(id) {
      if (id === viLogo.id) {
        return viLogo.resolved
      }
    },

    async load(id) {
      if (id === viLogo.resolved) {
        const logoFileContent = await Fs.read(config.paths.project.absolute.public.logo)
        const content = logoFileContent ? logoFileContent : await generateDefaultLogo()
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(content).toString(`base64`)}`
        return `export default ${JSON.stringify(dataUrl)}`
      }
    },
  }
}

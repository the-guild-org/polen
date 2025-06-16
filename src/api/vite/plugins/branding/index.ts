import type { Config } from '#api/api'
import { debug } from '#singletons/debug'
import { Fs } from '@wollybeard/kit'
import type { Plugin } from 'vite'

const generateDefaultLogo = async () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="48" fill="none" stroke="black" stroke-width="8"/>
</svg>`
}

export function Branding(config: Config.Config): Plugin {
  const _debug = debug.sub(['vite-plugin', 'branding'])

  _debug('initialized')

  return {
    name: 'polen:branding',
    enforce: 'pre',

    async buildStart() {
      this.addWatchFile(config.paths.project.absolute.public.logo)
    },

    async handleHotUpdate({ file, server }) {
      // Check if it's our watched logo file
      const isLogoFile = file === config.paths.project.absolute.public.logo

      if (isLogoFile) {
        _debug(`logo file changed`, { file })

        const logoModule = server.moduleGraph.getModuleById('\0virtual:polen/project/assets/logo.svg')
        if (logoModule) {
          server.moduleGraph.invalidateModule(logoModule)
        }

        // Send full reload to update all references
        server.ws.send({
          type: 'full-reload',
          path: '*',
        })

        return []
      }
    },

    resolveId(id) {
      if (id === 'virtual:polen/project/assets/logo.svg') {
        return '\0' + id
      }
    },

    async load(id) {
      if (id === '\0virtual:polen/project/assets/logo.svg') {
        const logoFileContent = await Fs.read(config.paths.project.absolute.public.logo)
        const content = logoFileContent ? logoFileContent : await generateDefaultLogo()
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`
        return `export default ${JSON.stringify(dataUrl)}`
      }
    },
  }
}

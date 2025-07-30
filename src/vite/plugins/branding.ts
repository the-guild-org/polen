import type { Config } from '#api/api'
import type { Vite } from '#dep/vite/index'
import { type ExistenceDiff, getMutationType, MutationType } from '#lib/mutation-type'
import { debugPolen } from '#singletons/debug'
import { Fs } from '@wollybeard/kit'
import type { Plugin } from 'vite'
import { polenVirtual } from '../vi.js'

const viLogo = polenVirtual([`project`, `assets`, `logo.svg`])

const generateDefaultLogo = async () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="48" fill="none" stroke="black" stroke-width="8"/>
</svg>`
}

export function Branding(config: Config.Config): Plugin {
  const debug = debugPolen.sub(`vite-plugin:branding`)
  debug(`initialized`)

  return {
    name: `polen:branding`,
    enforce: `pre`,

    async buildStart() {
      this.addWatchFile(config.paths.project.absolute.public.logo)
    },

    async handleHotUpdate({ file, server }) {
      return await handleWatchedFileChange({
        watchedFile: config.paths.project.absolute.public.logo,
        changedFile: file,
        moduleId: viLogo.resolved,
        server,
        debug: debug,
      })
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

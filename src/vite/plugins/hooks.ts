import { Api } from '#api/$'
import { ViteVirtual } from '#lib/vite-virtual'
import { polenVirtual } from '#vite/vi'
import type * as Vite from 'vite'

export const viProjectHooks = polenVirtual([`project`, `hooks`], { allowPluginProcessing: true })

export interface Options {
  config: Api.Config.Config
}

/**
 * Hooks plugin that handles user-defined hooks from hooks.ts or hooks.tsx
 */
export const Hooks = ({ config }: Options): Vite.Plugin => {
  return {
    name: 'polen:hooks-virtual',
    ...ViteVirtual.IdentifiedLoader.toHooks({
      identifier: viProjectHooks,
      async loader() {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')

        const hooksPathTs = path.join(config.paths.project.rootDir, 'hooks.ts')
        const hooksPathTsx = path.join(config.paths.project.rootDir, 'hooks.tsx')

        let hooksPath = null
        try {
          await fs.access(hooksPathTsx)
          hooksPath = hooksPathTsx
        } catch {
          try {
            await fs.access(hooksPathTs)
            hooksPath = hooksPathTs
          } catch {
            // No hooks file found
          }
        }

        if (!hooksPath) {
          // Return an empty module if no hooks file exists
          return `// No hooks file found`
        }

        return `export * from '${hooksPath}'`
      },
    }),
  }
}

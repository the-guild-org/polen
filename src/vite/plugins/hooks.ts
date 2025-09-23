import { Api } from '#api/$'
import { Ef, Op } from '#dep/effect'
import { ViteVirtual } from '#lib/vite-virtual'
import { polenVirtual } from '#vite/vi'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Fs, FsLoc } from '@wollybeard/kit'
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
        // Framework boundary: Vite expects Promise return type
        const hooksPathOption = await Ef.runPromise(
          Fs.findFirstUnderDir(config.paths.project.rootDir)([
            FsLoc.fromString('hooks.ts'),
            FsLoc.fromString('hooks.tsx'),
          ]).pipe(Ef.provide(NodeFileSystem.layer)),
        )

        const hooksPath = Op.getOrUndefined(hooksPathOption)

        if (!hooksPath) {
          // Return an empty module if no hooks file exists
          return `// No hooks file found`
        }

        return `export * from '${FsLoc.encodeSync(hooksPath)}'`
      },
    }),
  }
}

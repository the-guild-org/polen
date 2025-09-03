import type { Api } from '#api/$'
import { Vite } from '#dep/vite/index'
import { ViteVirtual } from '#lib/vite-virtual'
import { Path } from '@wollybeard/kit'
import { polenVirtual } from '../vi.js'

const viClientManifest = polenVirtual([`vite`, `client`, `manifest`])

export const Manifest = (config: Api.Config.Config): Vite.Plugin => {
  let configEnv: Vite.ConfigEnv

  return {
    name: `polen-manifest`,
    config(_, configEnv_) {
      configEnv = configEnv_
    },
    ...ViteVirtual.IdentifiedLoader.toHooks(
      {
        identifier: viClientManifest,
        loader: async () => {
          // In development just return an empty manifest
          if (configEnv.mode === Vite.ModeName.development) {
            return `export default {}`
          }

          const manifestPath = Path.join(config.paths.project.absolute.build.root, `.vite`, `manifest.json`)
          const module = await import(manifestPath, { with: { type: `json` } }) as {
            default: Vite.Manifest
          }

          return `export default ${JSON.stringify(module.default)}`
        },
      },
    ),
  }
}

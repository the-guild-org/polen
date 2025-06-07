import type { Vite } from '#dep/vite/index.js'

export const ViteConfig = (config: Vite.UserConfig): Vite.Plugin => {
  return {
    name: `config`,
    enforce: `pre`,
    config() {
      return config
    },
  }
}

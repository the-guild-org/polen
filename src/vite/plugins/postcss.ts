import type { Api } from '#api/$'
import type { Vite } from '#dep/vite/index'
import { Path } from '@wollybeard/kit'
import { existsSync } from 'node:fs'

/**
 * PostCSS and Tailwind CSS plugin for Polen.
 * Handles the CSS build pipeline with PostCSS and Tailwind.
 */
export const PostCSS = (
  config: Api.Config.Config,
): Vite.Plugin => {
  return {
    name: 'polen:postcss',
    config: (): Vite.UserConfig => {
      // Check if PostCSS config exists in project
      const postcssConfigPath = Path.join(config.paths.project.rootDir, 'postcss.config.js')
      const tailwindConfigPath = Path.join(config.paths.project.rootDir, 'tailwind.config.js')

      const hasPostCSS = existsSync(postcssConfigPath)
      const hasTailwind = existsSync(tailwindConfigPath)

      if (!hasPostCSS && !hasTailwind) {
        // No CSS processing needed
        return {}
      }

      // Configure CSS processing
      // Cast to any to work around Vite's strict PostCSS plugin typing
      // which doesn't properly handle the array format for plugins
      return {
        css: {
          postcss: hasPostCSS
            ? postcssConfigPath
            : hasTailwind
            ? postcssConfigPath // Let Vite handle finding postcss.config.js
            : undefined,
        },
      } as any
    },
  }
}

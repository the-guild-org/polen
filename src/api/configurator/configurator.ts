import type { Vite } from '#dep/vite/index.js'
import { Path } from '@wollybeard/kit'
import { z } from 'zod'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { type PackagePaths, packagePaths } from '../../package-paths.js'
import type { Schema } from '../schema/index.js'

export const BuildArchitectureEnum = {
  ssg: `ssg`,
  spa: `spa`,
  ssr: `ssr`,
} as const

export const BuildArchitecture = z.nativeEnum(BuildArchitectureEnum)

export type BuildArchitecture = typeof BuildArchitectureEnum[keyof typeof BuildArchitectureEnum]

type SchemaConfigInput = Omit<Schema.Config, `projectRoot`>

export interface ConfigInput {
  /**
   * Path to the root directory of your project.
   *
   * Relative paths will be resolved relative to the current working directory.
   *
   * @defaultValue process.cwd()
   */
  root?: string
  /**
   * Enable a special module explorer for the source code that Polen assembles for your app.
   *
   * Powered by [Vite Inspect](https://github.com/antfu-collective/vite-plugin-inspect).
   *
   * @defaultValue true
   */
  schema?: SchemaConfigInput
  schemaAugmentations?: SchemaAugmentation.Augmentation[]
  templateVariables?: {
    /**
     * Title of the app.
     *
     * Used in the navigation bar and in the title tag.
     *
     * @defaultValue `My Developer Portal`
     */
    title?: string
  }
  build?: {
    type: BuildArchitecture
  }
  advanced?: {
    explorer?: boolean
    /**
     * Tweak the watch behavior.
     */
    watch?: {
      /**
       * Restart the development server when some arbitrary files change.
       *
       * Use this to restart when files that are not already watched by vite change.
       *
       * @see https://github.com/antfu/vite-plugin-restart
       */
      /**
       * File paths to watch and restart the development server when they change.
       */
      also?: string[]
    }
    /**
     * Whether to enable debug mode.
     *
     * When enabled the following happens:
     *
     * - build output is NOT minified.
     *
     * @defaultValue false
     */
    debug?: boolean
    /**
     * Additional {@link vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
     *
     * @see https://vite.dev/config/
     * @see https://vite.dev/guide/api-javascript.html#mergeconfig
     */
    vite?: Vite.UserConfig
  }
}

export interface TemplateVariables {
  title: string
}

export interface Config {
  build: {
    type: BuildArchitecture
  }
  watch: {
    also: string[]
  }
  templateVariables: TemplateVariables
  schemaAugmentations: SchemaAugmentation.Augmentation[]
  schema: null | SchemaConfigInput
  ssr: {
    enabled: boolean
  }
  paths: {
    project: {
      rootDir: string
      relative: {
        build: {
          root: string
          relative: {
            assets: string
            serverEntrypoint: string
          }
        }
        pages: string
      }
      absolute: {
        build: {
          root: string
          assets: string
          serverEntrypoint: string
        }
        pages: string
      }
    }
    framework: PackagePaths
  }
  advanced: {
    explorer: boolean
    debug: boolean
    vite?: Vite.UserConfig
  }
}

const configInputDefaults: Config = {
  templateVariables: {
    title: `My Developer Portal`,
  },
  schemaAugmentations: [],
  watch: {
    also: [],
  },
  build: {
    type: BuildArchitectureEnum.ssg,
  },
  schema: null,
  ssr: {
    enabled: true,
  },
  paths: {
    project: {
      rootDir: process.cwd(),
      relative: {
        build: {
          root: `build`,
          relative: {
            serverEntrypoint: `app.js`,
            assets: `assets`,
          },
        },
        pages: `pages`,
      },
      absolute: {
        build: {
          root: Path.ensureAbsoluteWithCWD(`build`),
          serverEntrypoint: Path.ensureAbsoluteWithCWD(`build/app.js`),
          assets: Path.ensureAbsoluteWithCWD(`build/assets`),
        },
        pages: Path.ensureAbsoluteWithCWD(`pages`),
      },
    },
    framework: packagePaths,
  },
  advanced: {
    debug: false,
    explorer: false,
  },
}

export const normalizeInput = async (
  configInput?: ConfigInput,
  // eslint-disable-next-line
): Promise<Config> => {
  const config = structuredClone(configInputDefaults)

  if (configInput?.advanced?.debug !== undefined) {
    config.advanced.debug = configInput.advanced.debug
  }

  if (configInput?.root) {
    config.paths.project.rootDir = Path.ensureAbsoluteWithCWD(configInput.root)
    // Re-compute absolute paths
    config.paths.project.absolute.build.root = Path.join(
      config.paths.project.rootDir,
      config.paths.project.relative.build.root,
    )
    config.paths.project.absolute.build.assets = Path.join(
      config.paths.project.rootDir,
      config.paths.project.relative.build.relative.assets,
    )
    config.paths.project.absolute.pages = Path.join(
      config.paths.project.rootDir,
      config.paths.project.relative.pages,
    )
  }

  if (configInput?.advanced?.vite) {
    config.advanced.vite = configInput.advanced.vite
  }

  if (configInput?.schemaAugmentations) {
    config.schemaAugmentations = configInput.schemaAugmentations
  }

  config.templateVariables = {
    ...config.templateVariables,
    ...configInput?.templateVariables,
  }

  if (configInput?.schema) {
    config.schema = configInput.schema
  }

  if (configInput?.advanced?.explorer !== undefined) {
    config.advanced.explorer = configInput.advanced.explorer
  }

  if (configInput?.advanced?.watch?.also) {
    config.watch.also = configInput.advanced.watch.also
  }

  return config
}

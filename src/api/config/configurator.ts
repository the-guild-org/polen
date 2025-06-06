import type { Vite } from '#dep/vite/index.ts'
import { assertPathAbsolute } from '#lib/kit-temp.ts'
import { Path } from '@wollybeard/kit'
import { z } from 'zod'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.ts'
import { type PackagePaths, packagePaths } from '../../package-paths.ts'
import type { Schema } from '../schema/index.ts'

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
   * Relative paths will be resolved relative to this config file.
   *
   * @defaultValue The directory where the config file is located.
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
    architecture?: BuildArchitecture
  }
  advanced?: {
    explorer?: boolean
    /**
     * Force the CLI to resolve Polen imports in your project to itself rather than
     * to what you have installed in your project.
     *
     * If you are using a Polen CLI from your local project against your local project
     * then there can be no effect from this setting.
     *
     * This is mostly useful for:
     *
     * - Development of Polen itself
     * - Global CLI usage against ephemeral projects e.g. a directory with just a
     *   GraphQL Schema file.
     *
     * @defaultValue false
     */
    isSelfContainedMode?: boolean
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

const buildPaths = (rootDir: string): Config[`paths`] => {
  if (!Path.isAbsolute(rootDir)) throw new Error(`Root dir path must be absolute: ${rootDir}`)
  const ensureAbsolute = Path.ensureAbsoluteWith(rootDir)
  return {
    project: {
      rootDir,
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
          root: ensureAbsolute(`build`),
          serverEntrypoint: ensureAbsolute(`build/app.js`),
          assets: ensureAbsolute(`build/assets`),
        },
        pages: ensureAbsolute(`pages`),
      },
    },
    framework: packagePaths,
  }
}

export interface Config {
  _input: ConfigInput
  build: {
    architecture: BuildArchitecture
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
    isSelfContainedMode: boolean
    explorer: boolean
    debug: boolean
    vite?: Vite.UserConfig
  }
}

const configInputDefaults: Config = {
  _input: {},
  templateVariables: {
    title: `My Developer Portal`,
  },
  schemaAugmentations: [],
  watch: {
    also: [],
  },
  build: {
    architecture: BuildArchitecture.enum.ssg,
  },
  schema: null,
  ssr: {
    enabled: true,
  },
  paths: buildPaths(process.cwd()),
  advanced: {
    isSelfContainedMode: false,
    debug: false,
    explorer: false,
  },
}

export const normalizeInput = async (
  configInput: ConfigInput | undefined,
  /**
   * If the input has a relative root path, then resolve it relative to this path.
   *
   * We tell users relative paths are resolved to the config file directory.
   * Config loaders should pass the directory of the config file here to ensure that happens.
   *
   * If this is omitted, then relative root paths will throw an error.
   */
  baseRootDirPath: string,
  // eslint-disable-next-line
): Promise<Config> => {
  assertPathAbsolute(baseRootDirPath)

  const config = structuredClone(configInputDefaults)

  if (configInput) {
    config._input = configInput
  }

  if (configInput?.build?.architecture) {
    config.build.architecture = configInput.build.architecture
  }

  if (configInput?.advanced?.debug !== undefined) {
    config.advanced.debug = configInput.advanced.debug
  }

  if (configInput?.root !== undefined) {
    if (!baseRootDirPath && !Path.isAbsolute(configInput.root)) {
      throw new Error(
        `Root path must be absolute or baseRootPath must be provided to resolve relative root paths. Provided: ${configInput.root}`,
      )
    }
    const root = Path.ensureAbsolute(configInput.root, baseRootDirPath)
    config.paths = buildPaths(root)
  } else if (baseRootDirPath) {
    config.paths = buildPaths(baseRootDirPath)
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

  if (configInput?.advanced?.isSelfContainedMode !== undefined) {
    config.advanced.isSelfContainedMode = configInput.advanced.isSelfContainedMode
  }

  if (configInput?.advanced?.explorer !== undefined) {
    config.advanced.explorer = configInput.advanced.explorer
  }

  if (configInput?.advanced?.watch?.also) {
    config.watch.also = configInput.advanced.watch.also
  }

  return config
}

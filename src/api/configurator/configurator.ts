import type { Vite } from '#dep/vite/index.js'
import { Path } from '@wollybeard/kit'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { type PackagePaths, packagePaths } from '../../package-paths.js'
import type { Schema } from '../schema/index.js'

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
  explorer?: boolean
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
  /**
   * Path to the GraphQL schema file
   */
  // schema?: SchemaInput
  /**
   * Whether to enable SSR
   *
   * @defaultValue true
   */
  ssr?: boolean
  advanced?: {
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
  mode: string
  explorer: boolean
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
      buildDir: string
      conventions: {
        pagesDir: string
      }
    }
    framework: PackagePaths
  }
  advanced: {
    debug: boolean
    vite?: Vite.UserConfig
  }
}

const configInputDefaults: Config = {
  templateVariables: {
    title: `My Developer Portal`,
  },
  schemaAugmentations: [],
  explorer: true,
  watch: {
    also: [],
  },
  mode: `client`,
  schema: null,
  ssr: {
    enabled: true,
  },
  paths: {
    project: {
      rootDir: process.cwd(),
      buildDir: Path.ensureAbsoluteWithCWD(`dist`),
      conventions: {
        pagesDir: Path.ensureAbsoluteWithCWD(`pages`),
      },
    },
    framework: packagePaths,
  },
  advanced: {
    debug: false,
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
  }

  if (configInput?.advanced?.vite) {
    config.advanced.vite = configInput.advanced.vite
  }

  if (configInput?.ssr !== undefined) {
    config.ssr.enabled = configInput.ssr
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

  if (configInput?.explorer !== undefined) {
    config.explorer = configInput.explorer
  }

  if (configInput?.advanced?.watch?.also) {
    config.watch.also = configInput.advanced.watch.also
  }

  return config
}

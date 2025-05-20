import type { Vite } from '#dep/vite/index.js'
import { checkIsProjectHasPackageInstalled } from '#lib/helpers.js'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { sourcePaths } from '../../source-paths.js'
import type { Schema } from '../schema/index.js'
import type ReactVite from '@vitejs/plugin-react-swc'

type ReactViteOptions = Exclude<Parameters<typeof ReactVite>[0], undefined>

type SchemaConfigInput = Omit<Schema.Config, `projectRoot`>

export interface ConfigInput {
  root?: string
  /**
   * Enable a special module explorer for the source code that Polen assembles for your app.
   *
   * Powered by [Vite Inspect](https://github.com/antfu-collective/vite-plugin-inspect).
   *
   * @defaultValue true
   */
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
    also?: string[],
  }
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
    title?: string,
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
     * Additional {@link vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
     *
     * @see https://vite.dev/config/
     * @see https://vite.dev/guide/api-javascript.html#mergeconfig
     */
    vite?: Vite.UserConfig,
    vitePluginReact?: ReactViteOptions,
    jsxImportSource?: string,
  }
}

export interface TemplateVariables {
  title: string
}

export interface Config {
  root: string
  mode: string
  explorer: boolean
  watch: {
    also: string[],
  }
  templateVariables: TemplateVariables
  schemaAugmentations: SchemaAugmentation.Augmentation[]
  schema: null | SchemaConfigInput
  ssr: {
    enabled: boolean,
  }
  paths: {
    appTemplate: {
      dir: string,
      entryClient: string,
      entryServer: string,
    },
  }
  advanced: {
    jsxImportSource?: string,
    vite?: Vite.UserConfig,
    vitePluginReact?: ReactViteOptions,
  }
}

const configInputDefaults: Config = {
  root: process.cwd(),
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
    appTemplate: {
      dir: sourcePaths.template.dir,
      entryServer: sourcePaths.template.modulePaths.entryServer,
      entryClient: sourcePaths.template.modulePaths.entryClient,
    },
  },
  advanced: {
    jsxImportSource: `react`,
  },
}

export const normalizeInput = async (configInput?: ConfigInput): Promise<Config> => {
  const config = structuredClone(configInputDefaults)

  if (configInput?.root) {
    config.root = configInput.root
  }

  if (configInput?.advanced?.jsxImportSource) {
    config.advanced.jsxImportSource = configInput.advanced.jsxImportSource
  } else {
    const isHasReact = await checkIsProjectHasPackageInstalled(config.root, `react`)
    if (!isHasReact) {
      config.advanced.jsxImportSource = `react`
    } else {
      config.advanced.jsxImportSource = `polen/dependencies/react`
    }
  }

  if (configInput?.advanced?.vite) {
    config.advanced.vite = configInput.advanced.vite
  }

  if (configInput?.advanced?.vitePluginReact) {
    config.advanced.vitePluginReact = configInput.advanced.vitePluginReact
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

  if (configInput?.watch?.also) {
    config.watch.also = configInput.watch.also
  }

  return config
}

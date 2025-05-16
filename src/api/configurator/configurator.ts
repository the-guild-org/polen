import type { Vite } from '#dep/vite/index.js'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { sourcePaths } from '../../source-paths.js'
import type { Schema } from '../schema/index.js'

type SchemaConfigInput = Omit<Schema.Config, `projectRoot`>

export interface ConfigInput {
  /**
   * Additional {@link Vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
   *
   * @see https://vite.dev/config/
   * @see https://vite.dev/guide/api-javascript.html#mergeconfig
   */
  vite?: Vite.UserConfig
  /**
   * Enable a special module explorer for the source code that Polen assembles for your app.
   *
   * Powered by [Vite Inspect](https://github.com/antfu-collective/vite-plugin-inspect).
   *
   * @defaultValue true
   */
  inspect?: boolean
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
}

export interface TemplateVariables {
  title: string
}

export interface Config {
  mode: string
  inspect: boolean
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
}

const configInputDefaults: Config = {
  templateVariables: {
    title: `My Developer Portal`,
  },
  schemaAugmentations: [],
  inspect: true,
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
}

export const normalizeInput = (configInput?: ConfigInput): Config => {
  const config = structuredClone(configInputDefaults)

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

  if (configInput?.inspect !== undefined) {
    config.inspect = configInput.inspect
  }

  if (configInput?.watch?.also) {
    config.watch.also = configInput.watch.also
  }

  return config
}

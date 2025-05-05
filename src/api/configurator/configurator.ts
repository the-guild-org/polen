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

  return config
}

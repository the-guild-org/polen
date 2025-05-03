import { casesHandled } from '#lib/prelude/prelude.js'
import type { Vite } from '#dep/vite/index.js'
import type { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { sourcePaths } from '../../source-paths.js'
import type { SchemaPointer } from './schema-pointer.js'
import type { Changelog } from '../changelog/index.js'

export interface ConfigInput {
  /**
   * Additional {@link Vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
   *
   * @see https://vite.dev/config/
   * @see https://vite.dev/guide/api-javascript.html#mergeconfig
   */
  vite?: Vite.UserConfig
  changelog?: Changelog.Changelog
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
  schema?: SchemaInput
  /**
   * Whether to enable SSR
   *
   * @defaultValue true
   */
  ssr?: boolean
}

type SchemaInput = string | SchemaPointer

export interface TemplateVariables {
  title: string
}

export interface Config {
  templateVariables: TemplateVariables
  schemaAugmentations: SchemaAugmentation.Augmentation[]
  changelog: null | Changelog.Changelog
  mode: string
  schema: SchemaPointer
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
  changelog: null,
  schemaAugmentations: [],
  mode: `client`,
  schema: {
    type: `file`,
    path: `schema.graphql`,
  },
  ssr: {
    enabled: true,
  },
  // aliases: {
  //   entryServer: `#polen/server/entry`,
  // },
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

  if (configInput?.schema !== undefined) {
    config.schema = resolveInputSchema(configInput.schema)
  }

  if (configInput?.changelog !== undefined) {
    config.changelog = configInput.changelog
  }

  return config
}

// Resolvers -------------------------------------------------------------

const resolveInputSchema = (input: SchemaInput): Config[`schema`] => {
  if (typeof input === `string`) {
    return {
      type: `file`,
      path: input,
    }
  } else if (input.type === `file`) {
    return input
    // eslint-disable-next-line
  } else if (input.type === `inline`) {
    return input
  } else {
    return casesHandled(input)
  }
}

import { Path } from '../lib/path/_namespace.js'
import { casesHandled } from '../lib/prelude/main.js'
import type { Vite } from '../lib/vite/_namespace.js'
import type { SchemaAugmentation } from '../schema-augmentation/_namespace.js'
import { SchemaPointer } from './schema-pointer.js'

export interface ConfigInput {
  /**
   * Additional {@link Vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
   *
   * @see https://vite.dev/config/
   * @see https://vite.dev/guide/api-javascript.html#mergeconfig
   */
  vite?: Vite.UserConfig
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
  // port?: number
}

type SchemaInput = string | SchemaPointer

export interface TemplateVariables {
  title: string
}

export interface Config {
  templateVariables: TemplateVariables
  schemaAugmentations: SchemaAugmentation.Augmentation[]
  mode: string
  schema: SchemaPointer
  ssr: {
    enabled: boolean,
  }
  aliases: {
    entryServer: string,
  }
  paths: {
    workspaceDir: string,
    appTemplate: {
      dir: string,
      entryClient: string,
      entryServer: string,
    },
    outDir: string,
    outViteDir: string,
  }
}

const pathAppTemplateDir = Path.join(import.meta.dirname, `../app-template`)
const workspaceDir = process.cwd()

const outDir = Path.join(workspaceDir, `dist`)

const configInputDefaults: Config = {
  templateVariables: {
    title: `My Developer Portal`,
  },
  schemaAugmentations: [],
  mode: `client`,
  schema: {
    type: `file`,
    path: Path.join(workspaceDir, `schema.graphql`),
  },
  ssr: {
    enabled: true,
  },
  aliases: {
    entryServer: `#polen/server/entry`,
  },
  paths: {
    appTemplate: {
      dir: pathAppTemplateDir,
      entryServer: Path.join(pathAppTemplateDir, `entry.server.jsx`),
      entryClient: Path.join(pathAppTemplateDir, `entry.client.jsx`),
    },
    workspaceDir,
    outDir: Path.join(workspaceDir, `build`),
    outViteDir: Path.join(outDir),
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
    config.schema = resolveInputSchema(configInput.schema, config)
  }

  return config
}

// Resolvers -------------------------------------------------------------

const resolveInputSchema = (input: SchemaInput, config: Config): Config[`schema`] => {
  if (typeof input === `string`) {
    return {
      type: `file`,
      path: Path.absolutify(input, config.paths.workspaceDir),
    }
  } else if (input.type === `file`) {
    return {
      ...input,
      path: Path.absolutify(input.path, config.paths.workspaceDir),
    }
    // eslint-disable-next-line
  } else if (input.type === `inline`) {
    return input
  } else {
    return casesHandled(input)
  }
}

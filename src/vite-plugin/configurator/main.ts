import { Path } from '../../lib/path/_namespace.js'

export interface ConfigInput {
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
  schemaPath?: string
  /**
   * Whether to enable SSR
   *
   * @defaultValue true
   */
  ssr?: boolean
  // port?: number
}

export interface TemplateVariables {
  title: string
}

export interface Config {
  templateVariables: TemplateVariables
  mode: string
  schema: {
    path: string,
  }
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

const pathAppTemplateDir = Path.join(import.meta.dirname, `../../app-template`)
const workspaceDir = process.cwd()

const outDir = Path.join(workspaceDir, `dist`)

const configInputDefaults: Config = {
  templateVariables: {
    title: `My Developer Portal`,
  },
  mode: `client`,
  schema: {
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

  config.templateVariables = {
    ...config.templateVariables,
    ...configInput?.templateVariables,
  }

  if (configInput?.schemaPath !== undefined) {
    config.schema.path = Path.absolutify(configInput.schemaPath, config.paths.workspaceDir)
  }

  return config
}

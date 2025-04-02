import * as GetPortPlease from 'get-port-please'
import { Path } from '../../lib/path/_namespace.js'

export interface ConfigInput {
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

export interface Config {
  schema: {
    path: string,
  }
  ssr: {
    enabled: boolean,
  }
  server: {
    port: number,
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
    // outDirTmp: string,
    outDir: string,
    outViteDir: string,
    outNitroDir: string,
    // viteIndexHtml: string,
  }
}

const pathAppTemplateDir = Path.join(import.meta.dirname, `../../app-template`)
const workspaceDir = process.cwd()

const outDir = Path.join(workspaceDir, `build`)

const configInputDefaults: Config = {
  schema: {
    path: Path.join(workspaceDir, `schema.graphql`),
  },
  ssr: {
    enabled: true,
  },
  server: {
    port: 3000,
  },
  aliases: {
    entryServer: `#pollen/server/entry`,
  },
  paths: {
    appTemplate: {
      dir: pathAppTemplateDir,
      entryServer: Path.join(pathAppTemplateDir, `entry.server.jsx`),
      entryClient: Path.join(pathAppTemplateDir, `entry.client.jsx`),
      // viteIndexHtml: Path.join(pathAppTemplateDir, `index.html`),
    },
    workspaceDir,
    // outDirTmp: Path.join(workspaceDir, `.pollen`),
    outDir: Path.join(workspaceDir, `build`),
    outViteDir: Path.join(outDir, `vite`),
    outNitroDir: Path.join(outDir, `nitro`),
  },
}

export const normalizeInput = async (configInput?: ConfigInput): Promise<Config> => {
  const config = structuredClone(configInputDefaults)

  if (configInput?.ssr !== undefined) {
    config.ssr.enabled = configInput.ssr
  }

  if (configInput?.schemaPath !== undefined) {
    config.schema.path = Path.absolutify(configInput.schemaPath, config.paths.workspaceDir)
  }

  const availablePort = await GetPortPlease.getPort({
    port: config.server.port,
    portRange: [3000, 3999],
  })
  config.server.port = availablePort

  return config
}

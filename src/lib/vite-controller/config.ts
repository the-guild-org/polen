import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { Path } from '../path/_namespace.js'
import type { Vite } from '../vite/_namespace.js'
// import ReactVite from '@vitejs/plugin-react'

const rootPath = Path.join(import.meta.dirname, `../../project/app`)

/**
 * Common Vite configuration options
 */
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
  port?: number
}

export interface Config {
  // schemaPath: string
  ssr: boolean
  port: number
}

const configInputDefaults: Config = {
  ssr: true,
  port: 3000,
}

const normalizeConfigInput = async (options?: ConfigInput): Promise<Config> => {
  const config: Config = {
    ...configInputDefaults,
  }

  for (const [key, value] of entries(options ?? {})) {
    if (value !== undefined) {
      // @ts-expect-error
      config[key] = value
    }
  }

  const port = await GetPortPlease.getPort({
    port: config.port + 1000,
    portRange: [4000, 4999],
  })

  config.port = port

  return config
}

import * as GetPortPlease from 'get-port-please'
import { entries } from '../prelude/main.js'

const createBaseConfig = async (configInput?: ConfigInput): Promise<Vite.InlineConfig> => {
  const config = await normalizeConfigInput(configInput)

  return {
    configFile: false,
    root: rootPath,
    server: {
      port: config.port,
      // When SSR is enabled, use middleware mode
      ...(config.ssr && {
        middlewareMode: true,
        hmr: {
          port: 3000,
        },
      }),
    },
    // Support for SSR builds
    appType: config.ssr ? `custom` : `spa`,
    // Enable sourcemaps in both dev and prod
    build: {
      sourcemap: true,
    },
    plugins: [
      // ...ReactVite(),
      TanStackRouterVite({
        target: `react`,
        autoCodeSplitting: true,
        enableRouteGeneration: false,
      }),
      // Plugins.GraphQLSchema({ schemaPath }),
    ],
  }
}

export const createDevConfig = async (options?: ConfigInput): Promise<Vite.InlineConfig> => {
  const { ssr = true } = options ?? {}
  const baseConfig = await createBaseConfig({ ssr })

  return {
    ...baseConfig,
  }
}

export const createBuildConfig = async (
  options?: { outDir?: string, minify?: boolean, ssr?: boolean },
): Promise<Vite.InlineConfig> => {
  const { outDir = `dist`, minify = true, ssr = false } = options ?? {}

  const clientConfig = {
    ...(await createBaseConfig({ ssr })),
    build: {
      outDir: ssr ? `${outDir}/client` : outDir,
      minify: minify ? `esbuild` as const : false,
      sourcemap: true,
      emptyOutDir: true, // Ensure directory is clean before build
    },
  }

  return clientConfig
}

// /**
//  * Create a Vite SSR build configuration for the server
//  */
// export const createSSRBuildConfig = (options?: { outDir?: string; minify?: boolean }): Vite.InlineConfig => {
//   const { outDir = `dist`, minify = true } = options ?? {}

//   return {
//     ...createBaseConfig({ ssr: true }),
//     build: {
//       outDir: `${outDir}/server`,
//       minify: minify ? `esbuild` as const : false,
//       sourcemap: true,
//       ssr: true,
//     },
//   }
// }

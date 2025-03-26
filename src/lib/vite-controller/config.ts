import type { InlineConfig, UserConfig } from 'vite'
import { Plugins } from './plugins/_namespace.js'
import { Path } from '../path/_namespace.js'

/**
 * Common Vite configuration options
 */
export interface CommonViteOptions {
  /**
   * Path to the GraphQL schema file
   */
  schemaPath: string
}

/**
 * Options for development configuration
 */
export interface DevConfigOptions extends CommonViteOptions {
  /**
   * Whether to open the browser automatically
   * @defaultValue true
   */
  open?: boolean

  /**
   * Port to start the development server on
   * @defaultValue undefined (Vite will use its default port)
   */
  port?: number
}

/**
 * Options for build configuration
 */
export interface BuildConfigOptions extends CommonViteOptions {
  /**
   * Output directory for built files
   * @defaultValue 'dist'
   */
  outDir?: string

  /**
   * Whether to minify the output
   * @defaultValue true
   */
  minify?: boolean
}

/**
 * Create a base Vite configuration with common plugins and settings
 */
const createBaseConfig = (options: CommonViteOptions): UserConfig => {
  const { schemaPath } = options

  return {
    root: `src/app`,
    plugins: [
      Plugins.GraphQLSchema({ schemaPath }),
    ],
  }
}

/**
 * Create a Vite development configuration
 */
export const createDevConfig = (options: DevConfigOptions): InlineConfig => {
  const { open = true, port, schemaPath } = options

  return {
    ...createBaseConfig({ schemaPath }),
    server: {
      open,
      ...(port !== undefined ? { port } : {}),
    },
  }
}

/**
 * Create a Vite build configuration
 */
export const createBuildConfig = (options: BuildConfigOptions): InlineConfig => {
  const { outDir = `dist`, minify = true, schemaPath } = options

  // Ensure output directory is absolute
  const resolvedOutDir = Path.absolutify(outDir)

  return {
    ...createBaseConfig({ schemaPath }),
    build: {
      outDir: resolvedOutDir,
      minify: minify ? `esbuild` : false,
      sourcemap: true,
      emptyOutDir: true, // Ensure directory is clean before build
    },
  }
}

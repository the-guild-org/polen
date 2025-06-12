import jsesc from 'jsesc'
// import { id,or,exclude  } from 'rolldown/filter'
import {} from '@rolldown/pluginutils'
import type { Plugin } from 'vite'

export interface Codec {
  stringify(value: any): string
  parse(text: string): any
}

export interface VitePluginJsonImportsOptions {
  /**
   * Use a custom codec.
   */
  codec?: {
    /**
     * Import path for the custom codec to use in generated code.
     *
     * Must be a package name or use a path alias.
     *
     * Examples:
     * - '@my-org/my-codec' (npm package)
     * - '#utils/codec' (package subpath)
     * - 'my-codec' (npm package)
     * - '~/utils/codec' (if ~ is aliased in vite config)
     */
    importPath: string
    /**
     * Custom codec for validation and runtime parsing
     * The codec.parse() is used at build time to validate the JSON
     * The codec will be imported in the generated code for runtime parsing
     * @default JSON
     */
    validate?: Codec
    /**
     * The export (its name) to import.
     *
     * @default 'default'
     */
    importExport?: string
  }
  filter?: {
    /**
     * Module types to process (the file extension without the dot).
     * @default ['json']
     */
    moduleTypes?: string[]
    /**
     * Picomatch patterns to include
     * @default includes all files with configured extensions
     */
    id?: {
      include?: string | string[]
      /**
       * Picomatch patterns to exclude
       * @default excludes node_modules and files with \0 prefix
       */
      exclude?: string | string[]
    }
  }
  /**
   * Plugin name. Useful to customize if providing a custom codec e.g. `superjson`.
   *
   * @default 'json'
   */
  name?: string
}

export const create = (options: VitePluginJsonImportsOptions = {}): Plugin => {
  const codec = options.codec?.validate ?? JSON
  const codecImportExport = options.codec?.importExport ?? `default`

  const pluginName = options.name ?? `json-imports`

  // Always exclude \0 prefixed modules
  // eslint-disable-next-line no-control-regex
  const baseExcludePatterns: (string | RegExp)[] = [/^\0/]
  const moduleTypes = options.filter?.moduleTypes ?? [`json`]
  const isCustomCodec = Boolean(options.codec?.importPath)

  // Check if we should handle this file based on extension
  const shouldHandle = (id: string) => {
    // Exclude internal modules with \0 prefix
    if (id.startsWith('\0')) return false

    // Check if it has one of our configured extensions
    return moduleTypes.some(type => id.endsWith(`.${type}`))
  }

  return {
    name: pluginName,
    enforce: 'pre' as const,
    // declarative transform file
    transform(code, id) {
      if (!shouldHandle(id)) return

      try {
        // Skip validation for superjson since the codec validates the envelope format
        if (options.codec?.validate && !options.codec.importPath?.includes('superjson')) {
          codec.parse(code)
        }

        if (!isCustomCodec) {
          // For native JSON, use simple export
          return `export default ${jsesc(code)}`
        } else {
          // For custom codecs, we need to parse at runtime
          if (!options.codec?.importPath) {
            throw new Error(`codec.importPath is required when using a custom codec`)
          }

          const importIdentifier = codecImportExport === `default` ? `codec` : codecImportExport
          const importStatement = codecImportExport === `default`
            ? `import ${importIdentifier} from '${options.codec.importPath}'`
            : `import { ${codecImportExport} } from '${options.codec.importPath}'`

          return `
${importStatement}
const data = ${importIdentifier}.parse('${jsesc(code)}')
export { data as default }`
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.error(`Failed to parse JSON in ${id}: ${message}`)
      }
    },
  }
}

import { compile } from '@mdx-js/mdx'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { getCurrentSchema } from '../../vite/plugins/mdx-schema-bridge.js'
import { remarkGraphQLReferences } from './plugins/remark-graphql-references.js'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Core MDX configuration used across Polen.
 * This ensures consistent MDX processing for all content types.
 */
export const MDX_CONFIG = {
  jsxImportSource: 'polen/react',
  providerImportSource: 'polen/mdx',
  codeHike: {
    components: { code: 'CodeBlock' },
    syntaxHighlighting: {
      theme: 'github-light',
    },
  },
} as const

// ============================================================================
// Plugin Configuration
// ============================================================================

interface MdxPluginOptions {
  enableGraphQLReferences?: boolean
  onDiagnostic?: (diagnostic: any) => void
}

/**
 * Create standard remark and recma plugins configuration for MDX processing.
 * This ensures consistent plugin usage across all MDX compilation.
 */
export const createMdxPlugins = (options: MdxPluginOptions = {}) => ({
  remarkPlugins: [
    remarkFrontmatter,
    remarkGfm,
    [remarkCodeHike, MDX_CONFIG.codeHike] as any,
    // Conditionally add GraphQL references plugin
    ...(options.enableGraphQLReferences
      ? [
        [remarkGraphQLReferences, {
          schemaLoader: getCurrentSchema,
          onDiagnostic: options.onDiagnostic,
        }] as any,
      ]
      : []),
  ],
  recmaPlugins: [
    [recmaCodeHike, MDX_CONFIG.codeHike] as any,
  ],
})

// ============================================================================
// Compilation Functions
// ============================================================================

/**
 * Compile MDX content to function body format.
 * Used for runtime compilation of MDX content (e.g., example index files).
 *
 * @param content - The MDX content to compile
 * @param options - Optional plugin configuration
 * @returns Compiled MDX as a function body string
 */
export const compileMdxToFunctionBody = async (
  content: string,
  options?: MdxPluginOptions,
) => {
  return compile(content, {
    ...MDX_CONFIG,
    ...createMdxPlugins(options),
    outputFormat: 'function-body',
    development: false,
  })
}

/**
 * Get configuration for @mdx-js/rollup plugin.
 * Used for build-time compilation of MDX pages.
 *
 * @param options - Optional plugin configuration
 * @returns Configuration object for mdx rollup plugin
 */
export const getMdxRollupConfig = (options?: MdxPluginOptions) => {
  const plugins = createMdxPlugins(options)
  return {
    ...MDX_CONFIG,
    ...plugins,
    // Don't override rehypePlugins - keep the ones from createMdxPlugins
  }
}

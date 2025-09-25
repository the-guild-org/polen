import { Ef } from '#dep/effect'
import * as Mdx from '@mdx-js/mdx'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { Data } from 'effect'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import type { Pluggable } from 'unified'
import { getCurrentSchema } from '../../vite/plugins/mdx-schema-bridge.js'
import { type GraphQLReferenceOptions, remarkGraphQLReferences } from './plugins/remark-graphql-references.js'

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
  onDiagnostic?: GraphQLReferenceOptions['onDiagnostic']
}

/**
 * Create standard remark and recma plugins configuration for MDX processing.
 * This ensures consistent plugin usage across all MDX compilation.
 */
export const resolveOptionsPlugins = (options: MdxPluginOptions = {}): Mdx.CompileOptions => {
  const GraphQLReferences: Pluggable | null = options.enableGraphQLReferences
    ? [remarkGraphQLReferences, {
      schemaLoader: getCurrentSchema,
      onDiagnostic: options.onDiagnostic,
    }]
    : null

  return {
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      [remarkCodeHike, MDX_CONFIG.codeHike],
      ...(GraphQLReferences ? [GraphQLReferences] : []),
    ],
    recmaPlugins: [
      [recmaCodeHike, MDX_CONFIG.codeHike],
    ],
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class MdxCompilationError extends Data.TaggedError('MdxCompilationError')<{
  readonly content: string
  readonly error: unknown
}> {}

// ============================================================================
// Compilation Functions
// ============================================================================

/**
 * Compile MDX content to function body format.
 * Used for runtime compilation of MDX content (e.g., example index files).
 *
 * @param content - The MDX content to compile
 * @param options - Optional plugin configuration
 * @returns Effect that compiles MDX as a function body string
 */
export const compileMdxToFunctionBody = (
  content: string,
  options?: MdxPluginOptions,
): Ef.Effect<any, MdxCompilationError, never> =>
  Ef.tryPromise({
    try: () =>
      Mdx.compile(content, {
        ...MDX_CONFIG,
        ...resolveOptionsPlugins(options),
        outputFormat: 'function-body',
        development: false,
      }),
    catch: (error) =>
      new MdxCompilationError({
        content,
        error,
      }),
  })

/**
 * Get configuration for @mdx-js/rollup plugin.
 * Used for build-time compilation of MDX pages.
 *
 * @param options - Optional plugin configuration
 * @returns Configuration object for mdx rollup plugin
 */
export const getMdxRollupConfig = (options?: MdxPluginOptions): Mdx.CompileOptions => {
  const plugins = resolveOptionsPlugins(options)
  const { codeHike: _, ...mdxConfigWithoutCodeHike } = MDX_CONFIG
  return {
    ...mdxConfigWithoutCodeHike,
    ...plugins,
    // Don't override rehypePlugins - keep the ones from createMdxPlugins
  }
}

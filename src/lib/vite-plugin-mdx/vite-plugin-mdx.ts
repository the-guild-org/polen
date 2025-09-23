// Note: This is adapted from `@mdx-js/mdx`

import { Ef } from '#dep/effect'
import type { CompileOptions } from '@mdx-js/mdx'
import {
  createFormatAwareProcessors,
  type FormatAwareProcessors,
} from '@mdx-js/mdx/internal-create-format-aware-processors'
import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import { Data } from 'effect'
import type { SourceDescription } from 'rolldown'
import { SourceMapGenerator } from 'source-map'
import { VFile } from 'vfile'
import type { Plugin } from 'vite'

/**
 * Error type for MDX compilation failures
 */
export class MdxCompilationError extends Data.TaggedError('MdxCompilationError')<{
  readonly filePath: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Failed to compile MDX file: ${this.filePath}`
  }
}

type ApplicableOptions = Omit<CompileOptions, `SourceMapGenerator`>

interface ExtraOptions {
  /**
   * Picomatch patterns to exclude (optional).
   */
  exclude?: FilterPattern | null | undefined
  /**
   * Picomatch patterns to include (optional).
   */
  include?: FilterPattern | null | undefined
}

export type Options = ApplicableOptions & ExtraOptions

export const createConfig = (options?: Readonly<Options> | null | undefined): Options => {
  const {
    exclude,
    include = /\.mdx?$/, // Default to .md and .mdx files
    ...rest
  } = options ?? {}

  return {
    exclude,
    include,
    ...rest,
  }
}

/**
 * Compile MDX content using Effects
 * @internal
 */
const compileMdx = (
  file: VFile,
  processors: FormatAwareProcessors,
): Ef.Effect<SourceDescription, MdxCompilationError> =>
  Ef.tryPromise({
    try: async () => {
      const compiled = await processors.process(file)
      const code = String(compiled.value)
      const sourceDescription: SourceDescription = {
        code,
        moduleType: `jsx`,
        // When MDX compiles to JS (not JSX), we don't need to set moduleType
        // Cast to any because vfile's Map type is compatible with Rolldown's source map
        // but has minor type differences with exactOptionalPropertyTypes
        map: compiled.map as any,
      }
      return sourceDescription
    },
    catch: (error) =>
      new MdxCompilationError({
        filePath: file.path,
        cause: error,
      }),
  })

/**
 * Plugin to compile MDX.
 *
 * Uses Rolldown.
 *
 * @example
 * ```ts
 * // In Vite config
 * export default {
 *   plugins: [VitePluginMdx()]
 * }
 * ```
 */
export const VitePluginMdx = (options?: Readonly<Options> | null): Plugin => {
  const config = createConfig(options)

  const filter = createFilter(config.include, config.exclude)
  let formatAwareProcessors: FormatAwareProcessors

  return {
    name: `mdx`,
    // enforce: `pre`, // Run before other transforms
    config(__config, env) {
      // Initialize processors with Vite environment info
      formatAwareProcessors = createFormatAwareProcessors({
        SourceMapGenerator,
        jsx: true, // emit JSX, not JS
        development: env.mode === `development`,
        ...config,
      })
    },
    // Framework boundary: Vite plugin transform hook expects Promise return type
    async transform(value: string, id: string): Promise<SourceDescription | undefined> {
      const file = new VFile({ path: id, value })

      if (
        file.extname
        && filter(file.path)
        && formatAwareProcessors.extnames.includes(file.extname)
      ) {
        // Use Effect internally, convert to Promise at Vite boundary
        return await Ef.runPromise(
          compileMdx(file, formatAwareProcessors),
        )
      }
    },
  }
}

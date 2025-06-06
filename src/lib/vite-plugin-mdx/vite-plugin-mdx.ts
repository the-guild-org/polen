// TODO: use this or similar once transform hook can change module type and have result re-processed
// @see  https://github.com/rolldown/rolldown/issues/4004

import type { CompileOptions } from '@mdx-js/mdx'
import {
  createFormatAwareProcessors,
  type FormatAwareProcessors,
} from '@mdx-js/mdx/internal-create-format-aware-processors'
import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import type { SourceDescription } from 'rolldown'
import { SourceMapGenerator } from 'source-map'
import { VFile } from 'vfile'
import type { Plugin } from 'vite'

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

// eslint-disable-next-line
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
 * Plugin to compile MDX.
 *
 * Uses Rolldown.
 */
export function VitePluginMdx(options?: Readonly<Options> | null): Plugin {
  const config = createConfig(options)

  const filter = createFilter(config.include, config.exclude)
  let formatAwareProcessors: FormatAwareProcessors

  return {
    name: `mdx`,
    // TODO: should not be needed?
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
    async transform(value: string, id: string): Promise<SourceDescription | undefined> {
      const file = new VFile({ path: id, value })

      if (
        file.extname
        && filter(file.path)
        && formatAwareProcessors.extnames.includes(file.extname)
      ) {
        const compiled = await formatAwareProcessors.process(file)
        const code = String(compiled.value)
        const sourceDescription: SourceDescription = {
          code,
          moduleType: `jsx`,
          // When MDX compiles to JS (not JSX), we don't need to set moduleType
          map: compiled.map,
        }

        return sourceDescription
      }
    },
  }
}

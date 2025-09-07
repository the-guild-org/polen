import type { Api } from '#api/$'
import { ExamplesConfigObject } from '#api/examples/config'
import { ConfigSchema } from '#api/schema/config-schema'
import type { Catalog } from '#lib/catalog/$'
import { S } from '#lib/kit-temp/effect'
import { Fn, Obj } from '@wollybeard/kit'
import { Config } from '../config/normalized.js'

export const resolve = (config: Config, data: {
  examples?: Api.Examples.Catalog.Catalog | undefined
  schemas?: Catalog.Catalog | undefined
}): TemplateConfig => {
  return {
    ...Obj.omit(config, ['_input']),
    schema: {
      ...config.schema,
      enabled: Boolean(config.schema.enabled ?? data.schemas),
    },
    examples: {
      ...config.examples,
      enabled: Boolean(config.examples.enabled ?? (data.examples && data.examples.examples.length > 0)),
    },
  }
}

// ============================================================================
// Schema - Template Config
// ============================================================================

/**
 * Template configuration with all feature flags resolved.
 * This is the configuration that templates receive, where optional fields
 * that control feature enablement have been resolved to concrete values.
 */
export const TemplateConfig = S.extend(
  Config.pipe(S.omit('_input', 'schema', 'examples')),
  S.Struct({
    schema: S.extend(
      ConfigSchema.pipe(S.omit('enabled')),
      S.Struct({
        enabled: S.Boolean,
      }),
    ),
    examples: S.extend(
      ExamplesConfigObject.pipe(S.omit('enabled')),
      S.Struct({
        enabled: S.Boolean,
      }),
    ),
  }),
).annotations({
  identifier: 'TemplateConfig',
  title: 'Template Configuration',
  description: 'Fully resolved configuration for template consumption with all feature flags determined',
})

export type TemplateConfig = S.Schema.Type<typeof TemplateConfig>

// ============================================================================
// Constructors
// ============================================================================

export const makeTemplateConfig = Fn.identity(TemplateConfig)

// ============================================================================
// Type Guards
// ============================================================================

export const isTemplateConfig = S.is(TemplateConfig)

// ============================================================================
// Codecs
// ============================================================================

export const decodeTemplateConfig = S.decode(TemplateConfig)
export const encodeTemplateConfig = S.encode(TemplateConfig)
export const encodeSyncTemplateConfig = S.encodeSync(TemplateConfig)

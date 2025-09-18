import type { Api } from '#api/$'
import { ExamplesConfigObject } from '#api/examples/config'
import { ReferenceConfigObject } from '#api/reference/config'
import { ConfigSchema } from '#api/schema/config-schema'
import { S } from '#dep/effect'
import { Fn, Obj } from '@wollybeard/kit'
import type { Catalog } from 'graphql-kit'
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
    reference: {
      ...config.reference,
      // Reference is enabled if explicitly enabled OR if schemas exist (unless explicitly disabled)
      enabled: Boolean(config.reference.enabled ?? data.schemas),
      descriptionsView: config.reference.descriptionsView,
      nullabilityRendering: config.reference.nullabilityRendering,
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
  Config.pipe(S.omit('_input', 'schema', 'reference', 'examples')),
  S.Struct({
    schema: S.extend(
      ConfigSchema.pipe(S.omit('enabled')),
      S.Struct({
        enabled: S.Boolean,
      }),
    ),
    reference: S.Struct({
      enabled: S.Boolean,
      descriptionsView: S.Struct({
        defaultMode: S.Literal('compact', 'expanded'),
        showControl: S.Boolean,
      }),
      nullabilityRendering: S.Literal('questionMark', 'bangMark'),
      diagnostics: S.optional(S.Unknown), // From ReferenceConfigObject
    }),
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

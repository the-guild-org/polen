import { Vite } from '#dep/vite/index'
import { spreadShallow } from '#lib/kit-temp'
import type { ConfigInput } from './configurator.js'

/**
 * Deep merge two Polen config inputs.
 * The second config (overrides) takes precedence over the first (base).
 */
export const mergeInputs = (
  base: ConfigInput,
  overrides?: ConfigInput | undefined,
): ConfigInput => {
  if (!overrides) {
    return base
  }

  const merged: ConfigInput = spreadShallow(base, overrides)

  // Merge schema if both have it
  if (base.schema ?? overrides.schema) {
    merged.schema = overrides.schema ?? base.schema
  }

  // Merge build config
  if (base.build ?? overrides.build) {
    merged.build = spreadShallow(base.build, overrides.build)
  }

  // Merge server config
  if (base.server ?? overrides.server) {
    merged.server = spreadShallow(base.server, overrides.server)
  }

  // Merge warnings config
  if (base.warnings ?? overrides.warnings) {
    merged.warnings = spreadShallow(base.warnings, overrides.warnings)

    // Merge interactiveWithoutSchema config
    if (base.warnings?.interactiveWithoutSchema ?? overrides.warnings?.interactiveWithoutSchema) {
      merged.warnings.interactiveWithoutSchema = spreadShallow(
        base.warnings?.interactiveWithoutSchema,
        overrides.warnings?.interactiveWithoutSchema,
      )
    }
  }

  // Merge advanced config
  if (base.advanced ?? overrides.advanced) {
    merged.advanced = spreadShallow(base.advanced, overrides.advanced)

    // Merge Vite configs if present
    if (base.advanced?.vite ?? overrides.advanced?.vite) {
      merged.advanced.vite = Vite.mergeConfig(
        base.advanced?.vite ?? {},
        overrides.advanced?.vite ?? {},
      )
    }
  }

  return merged
}

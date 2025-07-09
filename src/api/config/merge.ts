import { Vite } from '#dep/vite/index'
import type { ConfigInput } from './configurator.js'

/**
 * Deep merge two Polen config inputs.
 * The second config (overrides) takes precedence over the first (base).
 */
export const mergeInputs = (
  base: ConfigInput,
  // eslint-disable-next-line
  overrides?: ConfigInput | undefined,
): ConfigInput => {
  if (!overrides) {
    return base
  }

  const merged: ConfigInput = {
    ...base,
    ...overrides,
  }

  // Merge schema if both have it
  if (base.schema || overrides.schema) {
    merged.schema = overrides.schema ?? base.schema
  }

  // Merge build config
  if (base.build || overrides.build) {
    merged.build = {
      ...base.build,
      ...overrides.build,
    }
  }

  // Merge advanced config
  if (base.advanced || overrides.advanced) {
    merged.advanced = {
      ...base.advanced,
      ...overrides.advanced,
    }

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

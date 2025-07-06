import { Fn } from '@wollybeard/kit'
import type { ConfigInput } from './configurator.js'

/**
 * Define a Polen configuration.
 * This is an identity function that provides type safety for config files.
 */
export const defineConfig = Fn.identity<ConfigInput>

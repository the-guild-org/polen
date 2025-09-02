import { Effect } from 'effect'
import * as TinyGlobby from 'tinyglobby'

// ============================================================================
// Types
// ============================================================================

export type GlobOptions = Omit<TinyGlobby.GlobOptions, 'patterns'>

// ============================================================================
// Functions
// ============================================================================

/**
 * Effect-based wrapper for globbing file patterns.
 * Returns an Effect that resolves to an array of matched file paths.
 */
export const glob = (
  pattern: string | string[],
  options?: GlobOptions,
): Effect.Effect<string[], Error> => 
  Effect.promise(() => TinyGlobby.glob(pattern, options))

/**
 * Synchronous Effect-based wrapper for globbing file patterns.
 */
export const globSync = (
  pattern: string | string[],
  options?: GlobOptions,
): Effect.Effect<string[], Error> =>
  Effect.try({
    try: () => TinyGlobby.globSync(pattern, options),
    catch: (error) => error instanceof Error ? error : new Error(String(error)),
  })
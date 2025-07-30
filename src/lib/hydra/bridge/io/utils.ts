import { Effect } from 'effect'
import type { BridgeErrors } from '../errors.js'
import { IO, type IOService } from './service.js'

// ============================================================================
// Extended Utility Functions
// ============================================================================

/**
 * Check if a file exists by attempting to read it
 */
export const fileExists = (
  path: string,
): Effect.Effect<boolean, BridgeErrors, IOService> =>
  Effect.gen(function*() {
    const io = yield* IO
    return yield* Effect.match(io.read(path), {
      onFailure: () => false,
      onSuccess: () => true,
    })
  })

/**
 * Ensure a directory exists (no-op for now as directories are implicit)
 */
export const ensureDir = (
  _dir: string,
): Effect.Effect<void, BridgeErrors, IOService> => Effect.succeed(undefined)

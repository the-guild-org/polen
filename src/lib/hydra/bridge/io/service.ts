import { Context, Effect } from 'effect'
import type { BridgeErrors } from '../errors.js'

// ============================================================================
// Service Definition
// ============================================================================

/**
 * IO operations service interface
 * Provides basic file operations for string data
 * JSON parsing/stringifying is handled by Bridge, not IO
 */
export interface IOService {
  readonly read: (relativePath: string) => Effect.Effect<string, BridgeErrors>
  readonly write: (relativePath: string, data: string) => Effect.Effect<void, BridgeErrors>
  readonly list: (relativePath: string) => Effect.Effect<ReadonlyArray<string>, BridgeErrors>
  readonly remove: (relativePath: string) => Effect.Effect<void, BridgeErrors>
}

export const IO = Context.GenericTag<IOService>('@hydra/bridge/IO')

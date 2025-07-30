import { Context, Effect } from 'effect'

// ============================================================================
// Service Definition
// ============================================================================

/**
 * IO operations service interface
 * Provides basic file operations for string data
 * JSON parsing/stringifying is handled by Bridge, not IO
 */
export interface IOService {
  readonly read: (relativePath: string) => Effect.Effect<string, Error>
  readonly write: (relativePath: string, data: string) => Effect.Effect<void, Error>
  readonly list: (relativePath: string) => Effect.Effect<ReadonlyArray<string>, Error>
  readonly remove: (relativePath: string) => Effect.Effect<void, Error>
}

export const IO = Context.GenericTag<IOService>('@hydra/bridge/IO')

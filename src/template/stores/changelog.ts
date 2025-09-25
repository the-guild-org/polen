import { Schema as S } from 'effect'
import { Revision, Schema as SchemaLib, Version } from 'graphql-kit'
import { proxy } from 'valtio'

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * State for each version - what revision is currently selected
 */
export const VersionState = S.Struct({
  currentRevision: S.NullOr(Revision),
})

export type VersionState = typeof VersionState.Type

/**
 * The changelog page state schema
 */
export const State = S.Struct({
  // Using a plain object instead of HashMap for valtio compatibility
  // Keys are Version.encodeSync() results
  versionMemory: S.Record({
    key: S.String,
    value: VersionState,
  }),
})

export type State = typeof State.Type

// ============================================================================
// Initial State
// ============================================================================

export const initialState: State = {
  versionMemory: {},
}

// ============================================================================
// Store
// ============================================================================

/**
 * Changelog store
 *
 * Manages navigation state for the changelog page, remembering
 * which revision was selected for each version during the session.
 */
export const store = proxy({
  ...initialState,

  /**
   * Remember the current revision for a version
   */
  rememberRevision(schema: SchemaLib.Versioned, revision: Revision | null) {
    const versionKey = Version.encodeSync(schema.version)
    store.versionMemory = {
      ...store.versionMemory,
      [versionKey]: { currentRevision: revision },
    }
  },

  /**
   * Get the remembered revision for a version
   */
  getRememberedRevision(schema: SchemaLib.Versioned): Revision | null {
    const versionKey = Version.encodeSync(schema.version)
    return store.versionMemory[versionKey]?.currentRevision ?? null
  },

  /**
   * Reset store to initial state
   */
  reset() {
    Object.assign(store, initialState)
  },

  /**
   * Set store state
   */
  set(data: State) {
    Object.assign(store, data)
  },
})

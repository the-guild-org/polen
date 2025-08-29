import { Schema as S } from 'effect'
import type { GraphQLSchema } from 'graphql'
import { proxy, ref } from 'valtio'

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Schema store state
 */
export const State = S.Struct({
  /** Currently selected schema version */
  currentVersion: S.String,
  /** All available schema versions */
  availableVersions: S.mutable(S.Array(S.String)),
  /** Currently loaded GraphQL schema instance */
  currentSchema: S.NullOr(S.Any), // GraphQL schema is too complex to model
})

export type State = S.Schema.Type<typeof State>

// ============================================================================
// Initial State
// ============================================================================

export const initialState: State = {
  currentVersion: 'latest',
  availableVersions: [],
  currentSchema: null,
}

// ============================================================================
// Store
// ============================================================================

/**
 * Schema store
 *
 * Manages GraphQL schema state including version selection and schema instances.
 * Used for version switching and schema-aware navigation.
 */
export const store = proxy({
  ...initialState,

  /**
   * Reset store to initial state
   */
  reset() {
    Object.assign(store, initialState)
  },

  /**
   * Set store state
   * @param data - New state data
   */
  set(data: State) {
    store.currentVersion = data.currentVersion
    store.availableVersions = data.availableVersions
    // Use ref() to prevent Valtio from deeply proxying the GraphQL schema
    store.currentSchema = data.currentSchema ? ref(data.currentSchema) : null
  },
})

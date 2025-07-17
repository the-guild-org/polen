import type { GraphQLSchema } from 'graphql'
import { proxy, ref } from 'valtio'

/**
 * Schema store state interface
 */
export interface State {
  /** Currently selected schema version */
  currentVersion: string
  /** All available schema versions */
  availableVersions: string[]
  /** Currently loaded GraphQL schema instance */
  currentSchema: GraphQLSchema | null
}

/**
 * Initial state for the schema store
 */
export const initialState: State = {
  currentVersion: 'latest',
  availableVersions: [],
  currentSchema: null,
}

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
    // Set each property individually to avoid issues with complex objects
    store.currentVersion = data.currentVersion
    store.availableVersions = data.availableVersions
    // Use ref() to prevent Valtio from deeply proxying the GraphQL schema
    store.currentSchema = data.currentSchema ? ref(data.currentSchema) : null
  },
})

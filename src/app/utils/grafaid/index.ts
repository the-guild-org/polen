/**
 * Grafaid - GraphQL utility helpers
 * A collection of type-safe utility functions for working with GraphQL types.
 */

// Re-export all utilities from the helpers module
export * from './helpers';

// Import and re-export as a namespace for users who want to use the Grafaid.* syntax
import * as Grafaid from './helpers';
export { Grafaid };

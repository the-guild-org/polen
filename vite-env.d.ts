/// <reference types="vite/client" />

/**
 * Type declarations for Vite's special import.meta features
 */

/**
 * Declaration for importing assets as raw strings using the ?raw suffix
 */
declare module '*?raw' {
  const content: string
  export default content
}

/**
 * Declaration for importing assets as URLs using the ?url suffix
 */
declare module '*?url' {
  const src: string
  export default src
}

/**
 * Declaration for importing static assets
 */
declare module '*.svg' {
  const content: string
  export default content
}

declare module 'virtual:pollen/assets/graphql-schema' {
  const content: string
  export default content
}

/**
 * Augmentation for the global Window interface
 */

// import type { RouterState } from 'react-router'

declare global {
  interface Window {
    __staticRouterHydrationData?: Partial<Pick<RouterState, `loaderData` | `actionData` | `errors`>>
  }
}

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

declare module 'virtual:polen/vite/client/manifest' {
  // eslint-disable-next-line
  const manifest: import('vite').Manifest
  export default manifest
}

declare module 'virtual:polen/*' {
  const content: string
  export default content
}

/**
 * Augmentation for the global Window interface
 */

declare global {
  interface Window {
    __staticRouterHydrationData?: Partial<
      // eslint-disable-next-line
      Pick<import('react-router').RouterState, `loaderData` | `actionData` | `errors`>
    >
  }
}

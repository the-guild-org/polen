/// <reference types="vite/client" />
/* eslint-disable */

//
//
// Type declarations for Vite's special import.meta features
//
//

/**
 * Indicates whether the code is running during a production build.
 * - `true` when running `polen build` command
 * - `false` when running `polen dev` command
 *
 * Use this to conditionally execute code only during the build process.
 * @example
 * if (__BUILDING__) {
 *   // Code that only runs during build
 * }
 */
declare const __BUILDING__: boolean

/**
 * Convenience boolean for checking if using Static Site Generation (SSG) architecture.
 * - `true` when `__BUILD_ARCHITECTURE__ === 'ssg'`
 * - `false` otherwise
 *
 * Useful for tree-shaking SSG-specific code.
 */
declare const __BUILD_ARCHITECTURE_SSG__: boolean

/**
 * The build architecture configured for the project.
 * - `'ssg'` for Static Site Generation (default)
 * - `'ssr'` for Server-Side Rendering (future support)
 *
 * Defined by the `build.architecture` configuration option in polen.config.ts.
 */
declare const __BUILD_ARCHITECTURE__: import('#api/config').Config.BuildArchitecture

/**
 * Indicates whether the code is running in development server mode.
 * - `true` when running `polen dev` command
 * - `false` when running `polen build` command
 *
 * Use this to conditionally execute code only during development.
 * @example
 * if (__SERVING__) {
 *   // Development-only code (e.g., debug logging, HMR setup)
 * }
 */
declare const __SERVING__: boolean

/**
 * The raw Vite command being executed.
 * - `'build'` for production builds
 * - `'serve'` for development server
 *
 * Provides the same information as `__BUILDING__` and `__SERVING__` but as a string value.
 * This is the raw value from Vite's configuration.
 */
declare const __COMMAND__: import('#dep/vite').Vite.ConfigEnv[`command`]

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
  const manifest: import('vite').Manifest
  export default manifest
}

declare module 'virtual:polen/template/variables' {
  export const templateVariables: import('#api/config/configurator').TemplateVariables
}

declare module 'virtual:polen/project/data' {
  export const PROJECT_DATA: import('#project-data').ProjectData
}

declare module 'virtual:polen/project/pages.jsx' {
  export const pages: import('#api/vite/plugins/core').ProjectPagesModule['pages']
}

declare module 'virtual:polen/template/schema-augmentations' {
  export const schemaAugmentations: import('#api/schema-augmentation/schema-augmentation').Augmentation[]
}

declare module 'virtual:polen/*' {
  const content: string
  export default content
}

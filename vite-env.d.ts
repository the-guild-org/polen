/// <reference types="vite/client" />
/* eslint-disable */

//
//
// Type declarations for Vite's special import.meta features
//
//

declare const __BUILDING__: boolean
declare const __BUILD_ARCHITECTURE_SSG__: boolean
declare const __BUILD_ARCHITECTURE__: import('#api/configurator/index.js').Configurator.BuildArchitecture
declare const __SERVING__: boolean
declare const __COMMAND__: import('#dep/vite/index.js').Vite.ConfigEnv[`command`]

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
  export const templateVariables: import('#api/configurator/configurator.js').TemplateVariables
}

declare module 'virtual:polen/project/pages.jsx' {
  export const pages: import('react-router').RouteObject[]
}

declare module 'virtual:polen/project/data' {
  export const PROJECT_DATA: import('#project-data.js').ProjectData
}

declare module 'virtual:polen/template/schema-augmentations' {
  export const schemaAugmentations: import('#api/schema-augmentation/schema-augmentation.js').Augmentation[]
}

declare module 'virtual:polen/*' {
  const content: string
  export default content
}

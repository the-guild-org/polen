/// <reference types="vite/client" />
/* eslint-disable */

//
//
// Type declarations for Vite's special import.meta features
//
//

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

declare module 'virtual:polen/project/routes.jsx' {
  export const routes: import('@react-router/dev/routes').RouteConfigEntry[]
}

declare module 'virtual:polen/template/schema-augmentations' {
  export const schemaAugmentations: import('#api/schema-augmentation/schema-augmentation').Augmentation[]
}

declare module 'virtual:polen/project/data/navbar.jsonsuper' {
  const data: import('#api/vite/state/navbar').NavbarData
  export { data as default }
}

declare module 'virtual:polen/project/data/pages-catalog.jsonsuper' {
  const data: import('#api/vite/plugins/pages').ProjectPagesCatalog
  export { data as default }
}

declare module 'virtual:polen/project/data/schema.jsonsuper' {
  const data: import('#api/schema/index').Schema.Schema | null
  export { data as default }
}

declare module 'virtual:polen/project/assets/logo.svg' {
  const src: string
  export default src
}

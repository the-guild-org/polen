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

declare module 'virtual:polen/template/variables' {
  export const templateVariables:
    // eslint-disable-next-line
    import('./src/vite-plugin/configurator/_exports.ts').TemplateVariables
}

declare module 'virtual:polen/template/schema-augmentations' {
  export const schemaAugmentations:
    // eslint-disable-next-line
    import('./src/schema-augmentation/schema-augmentation.js').Augmentation[]
}

declare module 'virtual:polen/*' {
  const content: string
  export default content
}

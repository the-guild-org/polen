declare module 'virtual:polen/vite/client/manifest' {
  const manifest: import('vite').Manifest
  export default manifest
}

declare module 'virtual:polen/template/variables' {
  export const templateVariables: import('#api/config/normalized').TemplateVariables
}

declare module 'virtual:polen/project/routes.jsx' {
  export const routes: import('#vite/plugins/core').ProjectRoutesModule['routes']
}

declare module 'virtual:polen/template/schema-augmentations' {
  export const schemaAugmentations: import('#api/schema/augmentations/schema-augmentation').Augmentation[]
}

declare module 'virtual:polen/project/data.json' {
  const data: import('#project-data').ProjectData
  export { data as default }
}

declare module 'virtual:polen/project/schema.json' {
  // Object mapping filenames to JSON content for the catalog bridge
  const schema: Record<string, string> | null
  export { schema as default }
}

// Virtual module uses .js extension due to Rolldown requirement
// that virtual modules must return JavaScript code with exports
declare module 'virtual:polen/project/data/pages-catalog.js' {
  const data: import('#vite/plugins/pages').ProjectPagesCatalog
  export { data as default }
}

declare module 'virtual:polen/project/assets/logo.svg' {
  const src: string
  export default src
}

declare module 'virtual:polen/template/home-config' {
  export const homeConfig: import('#api/config/normalized').HomeConfig
}

declare module 'virtual:polen/project/examples' {
  export const examplesCatalog: import('#api/examples/$').Examples.Catalog.Catalog
}

declare module 'virtual:polen/project/hooks' {
  export const navbar: ((props: import('#api/hooks/types').NavbarProps) => React.ReactNode) | null
}

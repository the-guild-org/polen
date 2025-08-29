declare module 'virtual:polen/vite/client/manifest' {
  const manifest: import('vite').Manifest
  export default manifest
}

declare module 'virtual:polen/template/variables' {
  export const templateVariables: import('#api/config/configurator').TemplateVariables
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

declare module 'virtual:polen/project/data/pages-catalog.json' {
  const data: import('#vite/plugins/pages').ProjectPagesCatalog
  export { data as default }
}

declare module 'virtual:polen/project/assets/logo.svg' {
  const src: string
  export default src
}

declare module 'virtual:polen/project/hooks' {
  export const navbar: ((props: import('#api/hooks/types').NavbarProps) => React.ReactNode) | null
}

declare module 'virtual:polen/vite/client/manifest' {
  const manifest: import('vite').Manifest
  export default manifest
}

declare module 'virtual:polen/project/routes.jsx' {
  export const routes: import('#vite/plugins/core').ProjectRoutesModule['routes']
}

declare module 'virtual:polen/project/assets/logo.svg' {
  const src: string
  export default src
}

declare module 'virtual:polen/project/schemas' {
  export const schemasCatalog: import('#lib/catalog/$').Catalog.Catalog | null
}

declare module 'virtual:polen/project/pages' {
  export const pagesCatalog: import('#vite/plugins/pages').ProjectPagesCatalog
}

declare module 'virtual:polen/project/examples' {
  export const examplesCatalog: import('#api/examples/$').Examples.Catalog.Catalog
  export const IndexComponent: React.ComponentType | null
}

declare module 'virtual:polen/project/config' {
  export const templateConfig: import('#api/config-template/template').TemplateConfig
}

declare module 'virtual:polen/project/navbar' {
  export const navbar: import('#api/content/navbar').NavbarItem[]
}

declare module 'virtual:polen/project/hooks' {
  export const navbar: ((props: import('#api/hooks/types').NavbarProps) => React.ReactNode) | null
}

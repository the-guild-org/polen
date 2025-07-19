/// <reference types="vite/client" />

declare module 'virtual:polen/project/hooks' {
  export const navbar: ((props: import('./api/hooks/types').NavbarProps) => React.ReactNode) | null
}

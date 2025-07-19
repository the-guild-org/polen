import type { NavbarProps } from './types.js'

export const Hooks = {
  navbar: (implementation: (props: NavbarProps) => React.ReactNode) => implementation,
}

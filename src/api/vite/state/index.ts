import { NavbarData, type NavbarDataRegistry } from './navbar.js'

export interface PolenState {
  navbar: NavbarDataRegistry
  // Future: other reactive state properties can be added here
}

export const createPolenState = (): PolenState => {
  return {
    navbar: NavbarData(),
  }
}

export type { NavbarData, NavbarDataRegistry, NavbarItem } from './navbar.js'

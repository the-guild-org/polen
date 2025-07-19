import type { NavbarItem } from '#api/content/navbar'

export interface NavbarProps {
  items: NavbarItem[]
  Item: React.ComponentType<{ item: NavbarItem; index: number }>
  Logo: React.ComponentType
  ThemeToggle: React.ComponentType
}

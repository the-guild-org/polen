import { ExtensibleData } from '#lib/extensible-data/index'

export interface NavbarItem {
  pathExp: string
  title: string
}
export type NavbarData = NavbarItem[]

export type NavbarDataRegistry = ExtensibleData.ExtensibleData<NavbarData>

export const NavbarData = () =>
  ExtensibleData.create<NavbarData>({
    create: () => [],
    join: (chunks) => chunks.flat(),
  })

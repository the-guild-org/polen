export interface Sidebar {
  items: Item[]
}

export type Item = ItemLink | ItemSection

export interface ItemLink {
  type: `ItemLink`
  title: string
  pathExp: string
}

export interface ItemSection {
  type: `ItemSection`
  title: string
  pathExp: string
  isLinkToo: boolean
  links: ItemLink[]
}

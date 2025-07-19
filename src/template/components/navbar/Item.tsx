import type { NavbarItem } from '#api/content/navbar'
import type React from 'react'
import { Link as PolenLink } from '../Link.js'

export const Item: React.FC<{ item: NavbarItem; index: number }> = ({ item }) => {
  return (
    <PolenLink color='gray' to={item.pathExp}>
      {item.title}
    </PolenLink>
  )
}

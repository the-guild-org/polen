import type { NavbarProps } from '#api/hooks/types'
import { Ar } from '#dep/effect'
import type React from 'react'

export const DefaultNavbar: React.FC<NavbarProps> = ({ items, Item, Logo, ThemeToggle }) => {
  const [leftItems, rightItems] = Ar.partition(items, item => item.position === 'right')

  return (
    <div className='flex items-center justify-between w-full'>
      {/* Logo */}
      <div className='flex-shrink-0'>
        <Logo />
      </div>

      {/* Center navigation */}
      <div className='flex items-center gap-4'>
        {leftItems.map((item, index) => <Item key={index} item={item} index={index} />)}
      </div>

      {/* Right actions */}
      <div className='flex items-center gap-4'>
        {rightItems.map((item, index) => <Item key={index} item={item} index={index} />)}
        <ThemeToggle />
      </div>
    </div>
  )
}

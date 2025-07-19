import type { NavbarProps } from '#api/hooks/types'
import { Flex } from '@radix-ui/themes'
import type React from 'react'

export const DefaultNavbar: React.FC<NavbarProps> = ({ items, Item, Logo, ThemeToggle }) => {
  return (
    <>
      <Logo />
      <Flex direction='row' gap='4' style={{ flex: 1 }}>
        {items
          .filter(item => item.position !== 'right')
          .map((item, index) => <Item key={index} item={item} index={index} />)}
      </Flex>
      <Flex direction='row' gap='4'>
        {items
          .filter(item => item.position === 'right')
          .map((item, index) => <Item key={index} item={item} index={index} />)}
      </Flex>
      <ThemeToggle />
    </>
  )
}

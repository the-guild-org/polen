import type { NavbarProps } from '#api/hooks/types'
import { Swiss } from '#lib/swiss'
import { Flex } from '@radix-ui/themes'
import { Array } from 'effect'
import type React from 'react'

export const DefaultNavbar: React.FC<NavbarProps> = ({ items, Item, Logo, ThemeToggle }) => {
  const [leftItems, rightItems] = Array.partition(items, item => item.position === 'right')

  return (
    <>
      {/* Logo */}
      <Swiss.Item cols={3}>
        <Logo />
      </Swiss.Item>

      {/* Center navigation */}
      <Swiss.Item cols={4}>
        <Flex direction='row' gap='4' justify='center' align='center'>
          {leftItems.map((item, index) => <Item key={index} item={item} index={index} />)}
        </Flex>
      </Swiss.Item>

      {/* Right actions */}
      <Swiss.Item cols={6}>
        <Flex direction='row' gap='4' justify='end' align='center'>
          {rightItems.map((item, index) => <Item key={index} item={item} index={index} />)}
          <ThemeToggle />
        </Flex>
      </Swiss.Item>
    </>
  )
}

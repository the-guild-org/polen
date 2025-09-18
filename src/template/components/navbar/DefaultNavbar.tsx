import type { NavbarProps } from '#api/hooks/types'
import { A } from '#dep/effect'
import type React from 'react'
import { Flex, GridItem } from '../ui/index.js'

export const DefaultNavbar: React.FC<NavbarProps> = ({ items, Item, Logo, ThemeToggle }) => {
  const [leftItems, rightItems] = A.partition(items, item => item.position === 'right')

  return (
    <>
      {/* Logo */}
      <GridItem span={3}>
        <Logo />
      </GridItem>

      {/* Center navigation */}
      <GridItem span={4}>
        <Flex direction='row' gap='4' justify='center' align='center'>
          {leftItems.map((item, index) => <Item key={index} item={item} index={index} />)}
        </Flex>
      </GridItem>

      {/* Right actions */}
      <GridItem span={6}>
        <Flex direction='row' gap='4' justify='end' align='center'>
          {rightItems.map((item, index) => <Item key={index} item={item} index={index} />)}
          <ThemeToggle />
        </Flex>
      </GridItem>
    </>
  )
}

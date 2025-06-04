import { Box, Flex, Text } from '@radix-ui/themes'
import { Link, useLocation } from 'react-router'

export interface SidebarItem {
  title: string
  pathExp: string
  children?: SidebarItem[]
}

interface SidebarProps {
  items: SidebarItem[]
}

export const Sidebar = ({ items }: SidebarProps) => {
  const location = useLocation()

  return (
    <Box
      style={{
        width: `240px`,
        borderRight: `1px solid var(--gray-3)`,
        height: `100%`,
        paddingRight: `var(--space-4)`,
      }}
    >
      <Flex direction='column' gap='1'>
        {items.map((item) => (
          <SidebarItem
            key={item.pathExp}
            item={item}
            currentPathExp={location.pathname}
          />
        ))}
      </Flex>
    </Box>
  )
}

interface SidebarItemProps {
  item: SidebarItem
  currentPathExp: string
  level?: number
}

const SidebarItem = ({ item, currentPathExp: currentPath, level = 0 }: SidebarItemProps) => {
  const isActive = currentPath === item.pathExp
  const hasChildren = item.children && item.children.length > 0

  return (
    <>
      <Link
        to={item.pathExp}
        style={{
          textDecoration: `none`,
          color: isActive ? `var(--accent-11)` : `var(--gray-12)`,
          padding: `var(--space-2) var(--space-3)`,
          paddingLeft: `calc(var(--space-3) + ${(level * 16).toString()}px)`,
          borderRadius: `var(--radius-2)`,
          display: `block`,
          backgroundColor: isActive ? `var(--accent-3)` : `transparent`,
          transition: `background-color 0.2s ease, color 0.2s ease`,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `var(--gray-2)`
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `transparent`
          }
        }}
      >
        <Text size='2' weight={isActive ? `medium` : `regular`}>
          {item.title}
        </Text>
      </Link>
      {hasChildren && (
        <Flex direction='column' gap='1'>
          {item.children!.map((child) => (
            <SidebarItem
              key={child.pathExp}
              item={child}
              currentPathExp={currentPath}
              level={level + 1}
            />
          ))}
        </Flex>
      )}
    </>
  )
}

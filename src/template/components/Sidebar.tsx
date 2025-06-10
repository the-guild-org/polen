import type { FileRouter } from '#lib/file-router/index'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Box, Flex, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

interface SidebarProps {
  items: FileRouter.Sidebar.Item[]
}

export const Sidebar = ({ items }: SidebarProps) => {
  const location = useLocation()

  return (
    <Box
      data-testid='sidebar'
      style={{
        width: `240px`,
        minWidth: `240px`,
        flexShrink: 0,
        borderRight: `1px solid var(--gray-3)`,
        height: `100%`,
        paddingRight: `var(--space-4)`,
      }}
    >
      <Flex direction='column' gap='1'>
        {items.map((item) => (
          <SidebarItemComponent
            key={item.pathExp}
            item={item}
            currentPathExp={location.pathname}
          />
        ))}
      </Flex>
    </Box>
  )
}

interface SidebarItemComponentProps {
  item: FileRouter.Sidebar.Item
  currentPathExp: string
  level?: number
}

const SidebarItemComponent = ({ item, currentPathExp, level = 0 }: SidebarItemComponentProps) => {
  if (item.type === `ItemLink`) {
    return <SidebarNavItem nav={item} currentPathExp={currentPathExp} level={level} />
  }

  return <SidebarSectionItem section={item} currentPathExp={currentPathExp} level={level} />
}

interface SidebarNavItemProps {
  nav: FileRouter.Sidebar.ItemLink
  currentPathExp: string
  level: number
}

const SidebarNavItem = ({ nav, currentPathExp, level }: SidebarNavItemProps) => {
  const isActive = currentPathExp === nav.pathExp

  return (
    <Link
      to={nav.pathExp}
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
        {nav.title}
      </Text>
    </Link>
  )
}

interface SidebarSectionItemProps {
  section: FileRouter.Sidebar.ItemSection
  currentPathExp: string
  level: number
}

const SidebarSectionItem = ({ section, currentPathExp, level }: SidebarSectionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const isDirectlyActive = currentPathExp === section.pathExp
  const hasActiveChild = section.navs.some(nav => currentPathExp === nav.pathExp)
  const isActiveGroup = isDirectlyActive || hasActiveChild

  return (
    <>
      <Flex
        align='center'
        style={{
          padding: `var(--space-2) var(--space-3)`,
          paddingLeft: `calc(var(--space-3) + ${(level * 16).toString()}px)`,
          borderRadius: `var(--radius-2)`,
          backgroundColor: isDirectlyActive ? `var(--accent-3)` : hasActiveChild ? `var(--accent-2)` : `transparent`,
          transition: `background-color 0.2s ease`,
        }}
        onMouseEnter={(e) => {
          if (!isActiveGroup) {
            e.currentTarget.style.backgroundColor = `var(--gray-2)`
          }
        }}
        onMouseLeave={(e) => {
          if (!isActiveGroup) {
            e.currentTarget.style.backgroundColor = `transparent`
          }
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation()
            console.log(`Chevron clicked!`)
            setIsExpanded(!isExpanded)
          }}
          style={{
            display: `flex`,
            alignItems: `center`,
            cursor: `pointer`,
            padding: `4px`,
            marginRight: `4px`,
            marginLeft: `-4px`,
          }}
        >
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Box>
        {section.isNavToo
          ? (
            <Link
              to={section.pathExp}
              style={{
                textDecoration: `none`,
                color: isDirectlyActive ? `var(--accent-11)` : `var(--gray-12)`,
                flex: 1,
              }}
            >
              <Text size='2' weight={isDirectlyActive ? `bold` : `medium`}>
                {section.title}
              </Text>
            </Link>
          )
          : (
            <Text
              size='2'
              weight={isDirectlyActive ? `bold` : `medium`}
              style={{
                flex: 1,
                color: isDirectlyActive ? `var(--accent-11)` : `var(--gray-12)`,
              }}
            >
              {section.title}
            </Text>
          )}
      </Flex>
      {isExpanded && (
        <Flex direction='column' gap='1'>
          {section.navs.map((nav) => (
            <SidebarNavItem
              key={nav.pathExp}
              nav={nav}
              currentPathExp={currentPathExp}
              level={level + 1}
            />
          ))}
        </Flex>
      )}
    </>
  )
}

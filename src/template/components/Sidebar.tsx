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
      <style>
        {`
          /* Using data attributes - more idiomatic for Radix UI */
          .sidebar-nav-item:hover:not([data-active]) {
            background-color: var(--gray-2) !important;
          }
          .sidebar-section:hover:not([data-active]):not([data-active-child]) {
            background-color: var(--gray-2) !important;
          }

          /* Alternative with class names (current approach) */
          /*
          .sidebar-nav-item:hover:not(.active) {
            background-color: var(--gray-2) !important;
          }
          .sidebar-section:hover:not(.active):not(.has-active-child) {
            background-color: var(--gray-2) !important;
          }
          */
        `}
      </style>
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
  item: FileRouter.Sidebar.Item
  currentPathExp: string
  level?: number
}

const SidebarItem = ({ item, currentPathExp, level = 0 }: SidebarItemProps) => {
  if (item.type === `ItemLink`) {
    return <SidebarItemLink nav={item} currentPathExp={currentPathExp} level={level} />
  }

  return <SidebarItemSection section={item} currentPathExp={currentPathExp} level={level} />
}

interface SidebarItemLinkProps {
  nav: FileRouter.Sidebar.ItemLink
  currentPathExp: string
  level: number
}

const SidebarItemLink = ({ nav, currentPathExp, level }: SidebarItemLinkProps) => {
  // Normalize paths for comparison - remove leading slash if present
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp
  const isActive = normalizedCurrentPath === nav.pathExp

  return (
    <Link
      to={`/${nav.pathExp}`}
      data-active={isActive || undefined}
      className='sidebar-nav-item'
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
    >
      <Text size='2' weight={isActive ? `medium` : `regular`}>
        {nav.title}
      </Text>
    </Link>
  )
}

interface SidebarItemSectionProps {
  section: FileRouter.Sidebar.ItemSection
  currentPathExp: string
  level: number
}

const SidebarItemSection = ({ section, currentPathExp, level }: SidebarItemSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  // Normalize paths for comparison - remove leading slash if present
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp
  const isDirectlyActive = normalizedCurrentPath === section.pathExp
  const hasActiveChild = section.navs.some(nav => normalizedCurrentPath === nav.pathExp)
  const isActiveGroup = isDirectlyActive || hasActiveChild

  return (
    <>
      <Flex
        align='center'
        data-active={isDirectlyActive || undefined}
        data-active-child={hasActiveChild || undefined}
        className='sidebar-section'
        style={{
          padding: `var(--space-2) var(--space-3)`,
          paddingLeft: `calc(var(--space-3) + ${(level * 16).toString()}px)`,
          borderRadius: `var(--radius-2)`,
          backgroundColor: isDirectlyActive ? `var(--accent-3)` : hasActiveChild ? `var(--accent-2)` : `transparent`,
          transition: `background-color 0.2s ease`,
        }}
      >
        <Box
          onClick={() => {
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
              to={`/${section.pathExp}`}
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
            <SidebarItemLink
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

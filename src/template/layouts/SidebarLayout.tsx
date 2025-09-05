import type { Content } from '#api/content/$'
import { Swiss } from '#lib/swiss'
import { Box } from '@radix-ui/themes'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { HamburgerMenu } from '../components/HamburgerMenu.js'
import { Sidebar } from '../components/sidebar/Sidebar.js'

// Template layer extension: Allow React elements in title
interface TemplateItemLink extends Omit<Content.ItemLink, 'title'> {
  title: string | React.ReactNode
}

interface TemplateItemSection extends Omit<Content.ItemSection, 'title' | 'links'> {
  title: string | React.ReactNode
  links: TemplateItemLink[]
}

type TemplateItem = TemplateItemLink | TemplateItemSection

interface Props {
  children: React.ReactNode
  sidebar: TemplateItem[]
  basePath?: string
  topContent?: React.ReactNode
}

export const SidebarLayout: React.FC<Props> = ({ children, sidebar, basePath, topContent }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isShowSidebar = sidebar && sidebar.length > 0

  return (
    <Swiss.Body subgrid>
      {/* Mobile menu - only show when sidebar exists */}
      {isShowSidebar && (
        <Box display={{ initial: `block`, md: `none` }} mb='4'>
          <HamburgerMenu
            isOpen={mobileMenuOpen}
            onToggle={() => {
              setMobileMenuOpen(!mobileMenuOpen)
            }}
            onClose={() => {
              setMobileMenuOpen(false)
            }}
            sidebarData={sidebar}
            {...(basePath !== undefined && { basePath })}
            {...(topContent !== undefined && { topContent })}
          />
        </Box>
      )}

      {/* Desktop Sidebar - 3 columns */}
      {isShowSidebar && (
        <Swiss.Item cols={{ initial: 3, md: 3 }}>
          <Box
            display={{ initial: `none`, md: `block` }}
            position={'sticky'}
            top={'4'}
          >
            <Sidebar
              data={sidebar}
              {...(basePath !== undefined && { basePath })}
              {...(topContent !== undefined && { topContent })}
            />
          </Box>
        </Swiss.Item>
      )}

      {/* Main Content - 8 columns on mobile, 9 on desktop when sidebar exists, 12 when not */}
      <Swiss.Item cols={8} start={5}>
        {children}
      </Swiss.Item>
    </Swiss.Body>
  )
}

import type { Content } from '#api/content/$'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { HamburgerMenu } from '../components/HamburgerMenu.js'
import { Sidebar } from '../components/sidebar/Sidebar.js'
import { Box, Container } from '../components/ui/index.js'

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
    <Container>
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

      {/* Desktop layout with Flexbox */}
      <div className='flex gap-6'>
        {/* Desktop Sidebar */}
        {isShowSidebar && (
          <div className='hidden md:block w-64 flex-shrink-0'>
            <div className='sticky top-4'>
              <Sidebar
                data={sidebar}
                {...(basePath !== undefined && { basePath })}
                {...(topContent !== undefined && { topContent })}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className='flex-1 min-w-0'>
          {children}
        </div>
      </div>
    </Container>
  )
}

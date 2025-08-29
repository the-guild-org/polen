import type { Content } from '#api/content/$'
import { Box, Grid } from '@radix-ui/themes'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { HamburgerMenu } from '../components/HamburgerMenu.js'
import { Sidebar } from '../components/sidebar/Sidebar.js'

interface Props {
  children: React.ReactNode
  sidebar: Content.Item[]
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
    <Grid
      areas={{
        initial: `'content'`,
        sm: `'content'`,
        md: `'sidebar sidebar . content content content content content'`,
      }}
      rows='auto'
      columns={{ initial: `1fr`, sm: `1fr`, md: `repeat(8, 1fr)` }}
      gapX={{ initial: `0`, sm: `0`, md: `2` }}
    >
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

      {/* Desktop Sidebar */}
      {isShowSidebar && (
        <Box
          display={{ initial: `none`, xs: `none`, sm: `none`, md: `block` }}
          gridColumn='1 / 3'
          gridRow='1 / auto'
        >
          <Sidebar
            data={sidebar}
            {...(basePath !== undefined && { basePath })}
            {...(topContent !== undefined && { topContent })}
          />
        </Box>
      )}

      <Box gridArea='content / content / auto / 8'>
        {children}
      </Box>
    </Grid>
  )
}

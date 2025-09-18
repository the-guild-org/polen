// TODO: Review and replace inline styles with Tailwind classes
import type { Content } from '#api/content/$'
import type { React } from '#dep/react/index'
import { Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { useEffect } from 'react'
import { Sidebar } from '../components/sidebar/Sidebar.js'
import { Box, Flex, IconButton, Text } from './ui/index.js'

// Template layer extension: Allow React elements in title
interface TemplateItemLink extends Omit<Content.ItemLink, 'title'> {
  title: string | React.ReactNode
}

interface TemplateItemSection extends Omit<Content.ItemSection, 'title' | 'links'> {
  title: string | React.ReactNode
  links: TemplateItemLink[]
}

type TemplateItem = TemplateItemLink | TemplateItemSection

export interface HamburgerMenuProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  sidebarData: TemplateItem[]
  basePath?: string
  topContent?: React.ReactNode
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  sidebarData,
  basePath,
  topContent,
}) => {
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = `hidden`
    } else {
      document.body.style.overflow = ``
    }

    // Cleanup
    return () => {
      document.body.style.overflow = ``
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile menu button - show on mobile/tablet, hide on desktop */}
      <Box display={{ initial: `block`, xs: `block`, sm: `block`, md: `none`, lg: `none`, xl: `none` }}>
        <IconButton
          size='2'
          variant='ghost'
          onClick={onToggle}
          aria-label='Toggle navigation menu'
        >
          {isOpen ? <Cross2Icon width='18' height='18' /> : <HamburgerMenuIcon width='18' height='18' />}
        </IconButton>
      </Box>

      {/* Mobile Sidebar Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <Box
            position='fixed'
            inset='0'
            style={{
              backgroundColor: `var(--black-a9)`,
              zIndex: 50,
            }}
            onClick={onClose}
            display={{ initial: `block`, xs: `block`, sm: `block`, md: `none`, lg: `none`, xl: `none` }}
          />

          {/* Drawer */}
          <Box
            position='fixed'
            top='0'
            left='0'
            bottom='0'
            width='280px'
            style={{
              backgroundColor: `var(--color-background)`,
              boxShadow: `var(--shadow-6)`,
              zIndex: 100,
              overflowY: `auto`,
            }}
            p='4'
            display={{ initial: `block`, xs: `block`, sm: `block`, md: `none`, lg: `none`, xl: `none` }}
          >
            <Flex justify='between' align='center' mb='4'>
              <Text size='5' weight='bold'>Navigation</Text>
              <IconButton
                size='2'
                variant='ghost'
                onClick={onClose}
                aria-label='Close navigation menu'
              >
                <Cross2Icon width='18' height='18' />
              </IconButton>
            </Flex>
            <Sidebar
              data={sidebarData}
              {...(basePath !== undefined && { basePath })}
              {...(topContent !== undefined && { topContent })}
            />
          </Box>
        </>
      )}
    </>
  )
}

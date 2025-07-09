'use client'

import type { Content } from '#api/content/$'
import { Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Box, Flex, IconButton, Text } from '@radix-ui/themes'
import { useEffect } from 'react'
import { Sidebar } from '../components/sidebar/Sidebar.js'

export interface HamburgerMenuProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  sidebarData: Content.Item[]
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  sidebarData,
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
            <Sidebar data={sidebarData} />
          </Box>
        </>
      )}
    </>
  )
}

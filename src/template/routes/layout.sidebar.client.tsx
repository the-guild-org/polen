'use client'

import type { Content } from '#api/content/$'
import { Box, Grid } from '@radix-ui/themes'
import { Sidebar } from '../components/sidebar/Sidebar.js'

interface LayoutSidebarClientProps {
  children: React.ReactNode
  sidebarItems: Content.Item[]
}

export function LayoutSidebarClient({ children, sidebarItems }: LayoutSidebarClientProps) {
  return (
    <Grid columns={{ initial: '1fr', md: '250px 1fr' }} gap='8'>
      <Box display={{ initial: 'none', md: 'block' }}>
        <Sidebar data={sidebarItems} />
      </Box>
      <Box className='prose'>
        {children}
      </Box>
    </Grid>
  )
}
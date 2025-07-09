'use client'

import { Box } from '@radix-ui/themes'
import { Outlet } from 'react-router'

export function ComponentReferenceClient() {
  return (
    <Box className='prose'>
      <Outlet />
    </Box>
  )
}

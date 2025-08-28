import { Box, Flex } from '@radix-ui/themes'
import type React from 'react'

interface ChangelogRailwayLayoutProps {
  railway: React.ReactNode
  children: React.ReactNode
}

export const ChangelogRailwayLayout: React.FC<ChangelogRailwayLayoutProps> = ({
  railway,
  children,
}) => {
  return (
    <Flex gap='4' style={{ position: 'relative', width: '100%', alignItems: 'flex-start' }}>
      {/* Railway sidebar aligned below toolbar */}
      <Box style={{ paddingTop: '6rem' }}>
        {railway}
      </Box>

      {/* Main content area with version columns */}
      <Box
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Flex>
  )
}

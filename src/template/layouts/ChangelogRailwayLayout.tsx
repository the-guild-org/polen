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
    <Flex gap='4' style={{ position: 'relative', width: '100%' }}>
      {/* Railway sidebar */}
      {railway}

      {/* Main content area with version columns */}
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          paddingTop: '2rem',
        }}
      >
        {children}
      </Box>
    </Flex>
  )
}

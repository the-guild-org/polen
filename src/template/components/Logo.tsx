// TODO: Review and replace inline styles with Tailwind classes
import * as React from 'react'
import { useTheme } from '../contexts/ThemeContext.js'
import { Box, Flex, Text } from './ui/index.js'

interface LogoConfig {
  light: string
  dark: string
  mode: 'single' | 'dual'
  designedFor: 'light' | 'dark'
}

interface Props {
  src: string | LogoConfig
  title?: string
  height?: number
  showTitle?: boolean
}

export const Logo: React.FC<Props> = ({ src, title, height = 30, showTitle = true }) => {
  const { appearance } = useTheme()

  // Handle both legacy string src and new LogoConfig
  let logoSrc: string
  let needsInvert = false

  if (typeof src === 'string') {
    // Legacy mode - just use the string as-is
    logoSrc = src
  } else {
    // New mode with logo configuration
    if (src.mode === 'dual') {
      // Use theme-specific logo directly
      logoSrc = appearance === 'dark' ? src.dark : src.light
    } else {
      // Single logo - check if invert needed
      logoSrc = src.light // Same file for both in single mode
      // Invert when: logo designed for light mode but we're in dark mode, or vice versa
      needsInvert = (src.designedFor === 'light' && appearance === 'dark')
        || (src.designedFor === 'dark' && appearance === 'light')
    }
  }

  return (
    <Flex align='center' gap='2'>
      <Box style={{ height, display: `flex`, alignItems: `center` }}>
        <img
          src={logoSrc}
          alt={title}
          height={height}
          className='polen-logo'
          style={{
            height: `100%`,
            width: `auto`,
            transition: `filter 0.2s ease-in-out`,
            filter: needsInvert ? 'invert(1)' : undefined,
          }}
        />
      </Box>
      {showTitle && (
        <Text size='3' weight='medium'>
          {title}
        </Text>
      )}
    </Flex>
  )
}

// TODO: Review and replace inline styles with Tailwind classes
import type { React } from '#dep/react/index'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Badge, Box, Callout, Flex, Text } from './ui/index.js'

interface Props {
  title?: string
  children: React.ReactNode
  variant?: 'info' | 'warning'
}

/**
 * A component for showing development tips and guidance that is only visible in development mode.
 * Automatically hidden in production builds.
 */
export const DevelopmentTip: React.FC<Props> = ({
  title = 'Development Tip',
  variant = 'info',
  children,
}) => {
  // Only show in development mode
  if (__BUILDING__) {
    return null
  }

  const color = variant === 'warning' ? 'amber' : 'blue'

  return (
    <Callout.Root color={color} variant='surface' className='mb-4'>
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Callout.Text>
        <Flex direction='column' gap='2'>
          <Flex align='center' gap='2'>
            <Text weight='bold'>{title}</Text>
            <Badge color={color} variant='soft' size='1'>Dev Only</Badge>
          </Flex>
          <Box>{children}</Box>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}
